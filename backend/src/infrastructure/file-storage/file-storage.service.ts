import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  ListObjectsV2Command,
  ListBucketsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

export interface FileUploadOptions {
  folder?: string;
  subfolder?: string;
  filename?: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface StudentDocumentOptions {
  institutionId: string;
  studentId: string;
  documentType: 'joining-letter' | 'monthly-report' | 'completion-certificate' | 'offer-letter' | 'noc' | 'other';
  month?: string; // e.g., 'january-2025'
  year?: string;
  customName?: string;
}

export interface ReportUploadOptions {
  institutionId?: string;
  reportType: string;
  format: string;
}

export interface UploadResult {
  key: string;
  url: string;
  filename: string;
  size: number;
  contentType: string;
}

@Injectable()
export class FileStorageService implements OnModuleInit {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;
  private isConnected = false;

  constructor(private configService: ConfigService) {
    this.endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'http://localhost:9000');
    this.bucket = this.configService.get<string>('MINIO_BUCKET', 'cms-files');

    this.s3Client = new S3Client({
      endpoint: this.endpoint,
      region: this.configService.get<string>('MINIO_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
        secretAccessKey: this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
      },
      forcePathStyle: true,
    });
  }

  /**
   * Bootstrap: Verify MinIO connection and ensure bucket exists
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('='.repeat(50));
    this.logger.log('MinIO Storage Service - Initializing...');
    this.logger.log(`Endpoint: ${this.endpoint}`);
    this.logger.log(`Bucket: ${this.bucket}`);
    this.logger.log('='.repeat(50));

    try {
      // Test connection by listing buckets
      const { Buckets } = await this.s3Client.send(new ListBucketsCommand({}));
      this.logger.log(`MinIO connected successfully! Found ${Buckets?.length || 0} bucket(s)`);

      // Ensure our bucket exists
      await this.ensureBucketExists();

      this.isConnected = true;
      this.logger.log('MinIO Storage Service - Ready');
      this.logger.log('='.repeat(50));
    } catch (error) {
      this.isConnected = false;
      this.logger.error('='.repeat(50));
      this.logger.error('MinIO CONNECTION FAILED!');
      this.logger.error(`Error: ${error.message}`);
      this.logger.error(`Endpoint: ${this.endpoint}`);
      this.logger.error('Please ensure MinIO is running and credentials are correct.');
      this.logger.error('='.repeat(50));

      // Don't throw - allow app to start but log the error
      // Uploads will fail gracefully with proper error messages
    }
  }

  /**
   * Check if MinIO is connected
   */
  isMinioConnected(): boolean {
    return this.isConnected;
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Bucket "${this.bucket}" exists and accessible`);
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        try {
          await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucket }));
          this.logger.log(`Bucket "${this.bucket}" created successfully`);
        } catch (createError) {
          this.logger.error(`Failed to create bucket "${this.bucket}": ${createError.message}`);
          throw createError;
        }
      } else {
        this.logger.error(`Failed to check bucket "${this.bucket}": ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Verify connection before operations - attempts reconnect if needed
   */
  private async ensureConnectedAsync(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    // Try to reconnect
    this.logger.log('Attempting to reconnect to MinIO...');
    try {
      const { Buckets } = await this.s3Client.send(new ListBucketsCommand({}));
      this.logger.log(`MinIO reconnected! Found ${Buckets?.length || 0} bucket(s)`);
      await this.ensureBucketExists();
      this.isConnected = true;
    } catch (error) {
      this.logger.error(`MinIO reconnection failed: ${error.message}`);
      throw new Error('MinIO storage is not connected. Please check MinIO server status.');
    }
  }

  /**
   * Sync version for backward compatibility (logs warning if not connected)
   */
  private ensureConnected(): void {
    if (!this.isConnected) {
      this.logger.warn('MinIO connection not verified - operation may fail');
    }
  }

  /**
   * Build file path from options
   * Structure: folder/subfolder/filename
   */
  private buildFilePath(originalName: string, options: FileUploadOptions = {}): string {
    const { folder, subfolder, filename } = options;
    const parts: string[] = [];

    if (folder) parts.push(folder);
    if (subfolder) parts.push(subfolder);

    const finalName = filename || `${uuidv4()}-${originalName}`;
    parts.push(finalName);

    return parts.join('/');
  }

  /**
   * Build student document path
   * Structure: institutions/{institutionId}/students/{studentId}/{documentType}/{filename}
   */
  private buildStudentDocumentPath(
    originalName: string,
    options: StudentDocumentOptions,
  ): string {
    const { institutionId, studentId, documentType, month, year, customName } = options;
    const ext = originalName.split('.').pop()?.toLowerCase() || 'pdf';

    let filename: string;

    switch (documentType) {
      case 'joining-letter':
        filename = `${studentId}_joining-letter.${ext}`;
        break;
      case 'monthly-report':
        const monthName = month || this.getCurrentMonth();
        filename = `${studentId}_monthly-report_${monthName}.${ext}`;
        break;
      case 'completion-certificate':
        filename = `${studentId}_completion-certificate.${ext}`;
        break;
      case 'offer-letter':
        filename = `${studentId}_offer-letter.${ext}`;
        break;
      case 'noc':
        filename = `${studentId}_noc.${ext}`;
        break;
      default:
        filename = customName
          ? `${studentId}_${customName}.${ext}`
          : `${studentId}_${uuidv4()}.${ext}`;
    }

    const parts = [
      'institutions',
      institutionId,
      'students',
      studentId,
      documentType,
      filename,
    ];

    return parts.join('/');
  }

  /**
   * Build report path
   * Structure: institutions/{institutionId}/reports/{reportType}/{filename}
   * Or: reports/{reportType}/{filename} if no institution
   */
  private buildReportPath(options: ReportUploadOptions): string {
    const { institutionId, reportType, format } = options;
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const filename = `${reportType}_${dateStr}_${timeStr}.${format}`;

    if (institutionId) {
      return `institutions/${institutionId}/reports/${reportType}/${filename}`;
    }
    return `reports/${reportType}/${filename}`;
  }

  private getCurrentMonth(): string {
    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december',
    ];
    const now = new Date();
    return `${months[now.getMonth()]}-${now.getFullYear()}`;
  }

  // ============================================
  // Core Upload Methods
  // ============================================

  /**
   * Upload a file buffer
   */
  async uploadBuffer(
    buffer: Buffer,
    originalName: string,
    options: FileUploadOptions = {},
  ): Promise<UploadResult> {
    this.ensureConnected();

    const key = this.buildFilePath(originalName, options);
    const contentType = options.contentType || this.getContentType(originalName);

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          Metadata: options.metadata,
        }),
      );

      const url = `${this.endpoint}/${this.bucket}/${key}`;
      this.logger.log(`Uploaded: ${key}`);

      return {
        key,
        url,
        filename: key.split('/').pop(),
        size: buffer.length,
        contentType,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw new Error(`Failed to upload file to storage: ${error.message}`);
    }
  }

  /**
   * Upload a Multer file
   */
  async uploadFile(
    file: Express.Multer.File,
    options: FileUploadOptions = {},
  ): Promise<UploadResult> {
    return this.uploadBuffer(file.buffer, file.originalname, {
      ...options,
      contentType: options.contentType || file.mimetype,
    });
  }

  // ============================================
  // Student Document Methods
  // ============================================

  /**
   * Upload a student document with proper naming
   * Path: institutions/{institutionId}/students/{studentId}/{documentType}/{studentId}_{documentType}.ext
   */
  async uploadStudentDocument(
    file: Express.Multer.File,
    options: StudentDocumentOptions,
  ): Promise<UploadResult> {
    this.ensureConnected();

    const key = this.buildStudentDocumentPath(file.originalname, options);
    const contentType = file.mimetype || this.getContentType(file.originalname);

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: contentType,
          Metadata: {
            studentId: options.studentId,
            institutionId: options.institutionId,
            documentType: options.documentType,
            ...(options.month && { month: options.month }),
          },
        }),
      );

      const url = `${this.endpoint}/${this.bucket}/${key}`;
      this.logger.log(`Student document uploaded: ${key}`);

      return {
        key,
        url,
        filename: key.split('/').pop(),
        size: file.buffer.length,
        contentType,
      };
    } catch (error) {
      this.logger.error(`Failed to upload student document: ${error.message}`);
      throw new Error(`Failed to upload student document: ${error.message}`);
    }
  }

  /**
   * Upload student document from buffer
   */
  async uploadStudentDocumentBuffer(
    buffer: Buffer,
    originalName: string,
    options: StudentDocumentOptions,
  ): Promise<UploadResult> {
    const key = this.buildStudentDocumentPath(originalName, options);
    const contentType = this.getContentType(originalName);

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          studentId: options.studentId,
          institutionId: options.institutionId,
          documentType: options.documentType,
        },
      }),
    );

    const url = `${this.endpoint}/${this.bucket}/${key}`;
    this.logger.log(`Student document uploaded: ${key}`);

    return {
      key,
      url,
      filename: key.split('/').pop(),
      size: buffer.length,
      contentType,
    };
  }

  // ============================================
  // Report Methods
  // ============================================

  /**
   * Upload a generated report
   * Path: institutions/{institutionId}/reports/{reportType}/{reportType}_{timestamp}.{format}
   */
  async uploadReport(
    buffer: Buffer,
    options: ReportUploadOptions,
  ): Promise<UploadResult> {
    this.ensureConnected();

    const key = this.buildReportPath(options);
    const contentType = this.getContentType(`file.${options.format}`);

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          Metadata: {
            reportType: options.reportType,
            ...(options.institutionId && { institutionId: options.institutionId }),
          },
        }),
      );

      const url = `${this.endpoint}/${this.bucket}/${key}`;
      this.logger.log(`Report uploaded: ${key}`);

      return {
        key,
        url,
        filename: key.split('/').pop(),
        size: buffer.length,
        contentType,
      };
    } catch (error) {
      this.logger.error(`Failed to upload report: ${error.message}`);
      throw new Error(`Failed to upload report: ${error.message}`);
    }
  }

  // ============================================
  // File Operations
  // ============================================

  /**
   * Get file as buffer
   */
  async getFile(key: string): Promise<Buffer> {
    await this.ensureConnectedAsync();

    try {
      this.logger.log(`Fetching file from MinIO - Bucket: ${this.bucket}, Key: ${key}`);

      const response = await this.s3Client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );

      if (!response.Body) {
        throw new Error('Empty response body from MinIO');
      }

      const stream = response.Body as Readable;
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);
      this.logger.log(`File fetched successfully: ${key} (${buffer.length} bytes)`);
      return buffer;
    } catch (error) {
      this.logger.error(`Failed to get file - Bucket: ${this.bucket}, Key: ${key}`);
      this.logger.error(`Error details: ${error.name} - ${error.message}`);

      if (error.name === 'NoSuchKey' || error.Code === 'NoSuchKey') {
        throw new Error(`File not found in storage: ${key}`);
      }

      throw new Error(`Failed to retrieve file from storage: ${error.message}`);
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    this.logger.log(`Deleted: ${key}`);
  }

  /**
   * Get presigned download URL
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Get presigned upload URL
   */
  async getUploadUrl(key: string, contentType: string, expiresIn: number = 3600): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * List files in a folder
   */
  async listFiles(prefix: string): Promise<string[]> {
    const response = await this.s3Client.send(
      new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix }),
    );
    return (response.Contents || []).map((obj) => obj.Key);
  }

  /**
   * List all documents for a student
   */
  async listStudentDocuments(institutionId: string, studentId: string): Promise<string[]> {
    const prefix = `institutions/${institutionId}/students/${studentId}/`;
    return this.listFiles(prefix);
  }

  /**
   * Get public URL
   */
  getPublicUrl(key: string): string {
    return `${this.endpoint}/${this.bucket}/${key}`;
  }

  private getContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const types: Record<string, string> = {
      pdf: 'application/pdf',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xls: 'application/vnd.ms-excel',
      csv: 'text/csv',
      json: 'application/json',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
      zip: 'application/zip',
    };
    return types[ext] || 'application/octet-stream';
  }
}
