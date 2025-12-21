import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../core/database/prisma.service';
import { ReportGeneratorService } from './report-generator.service';
import { ExcelService } from './export/excel.service';
import { PdfService } from './export/pdf.service';
import { CsvService } from './export/csv.service';
import {
  ReportJobData,
  ReportStatus,
  ExportFormat,
  ReportType,
  ExportConfig,
} from './interfaces/report.interface';
import { FileStorageService } from '../../../infrastructure/file-storage/file-storage.service';

@Processor('report-generation')
@Injectable()
export class ReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(
    private prisma: PrismaService,
    private reportGenerator: ReportGeneratorService,
    private excelService: ExcelService,
    private pdfService: PdfService,
    private csvService: CsvService,
    private fileStorage: FileStorageService,
  ) {
    super();
  }

  async process(job: Job<ReportJobData>): Promise<any> {
    const { userId, reportType, config: jobConfig, reportId } = job.data;

    // Extract format from config or use default
    const formatStr = jobConfig?.format || job.data.format || 'excel';
    const filters = jobConfig?.filters || job.data.filters || {};

    // Convert string format to ExportFormat enum
    const formatMap: Record<string, ExportFormat> = {
      'excel': ExportFormat.EXCEL,
      'pdf': ExportFormat.PDF,
      'csv': ExportFormat.CSV,
      'json': ExportFormat.CSV, // fallback for json
    };
    const format = formatMap[formatStr] || ExportFormat.EXCEL;

    this.logger.log(
      `Processing report generation job ${job.id} for user ${userId}`,
    );

    try {
      // Update status to processing
      await this.updateReportStatus(reportId, ReportStatus.PROCESSING);

      // Fetch data based on report type
      this.logger.log(`Fetching data for report type: ${reportType}`);
      const data = await this.reportGenerator.generateReport(
        reportType as ReportType,
        filters,
      );

      if (!data || data.length === 0) {
        throw new Error('No data found for the given filters');
      }

      // Get report configuration
      const config = this.getExportConfig(reportType, data, filters, userId, format);

      // Generate file based on format
      this.logger.log(`Generating ${format} file`);
      let fileBuffer: Buffer;
      let fileName: string;
      let mimeType: string;

      switch (format) {
        case ExportFormat.EXCEL:
          fileBuffer = await this.excelService.generateExcel(config);
          fileName = `${reportType}_${Date.now()}.xlsx`;
          mimeType =
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;

        case ExportFormat.PDF:
          fileBuffer = await this.pdfService.generatePdf(config);
          fileName = `${reportType}_${Date.now()}.pdf`;
          mimeType = 'application/pdf';
          break;

        case ExportFormat.CSV:
          fileBuffer = await this.csvService.generateCsv(config);
          fileName = `${reportType}_${Date.now()}.csv`;
          mimeType = 'text/csv';
          break;

        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Validate buffer before upload
      this.logger.log(`Generated file buffer size: ${fileBuffer?.length || 0} bytes`);

      if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error('Generated file buffer is empty');
      }

      // Upload to MinIO
      this.logger.log('Uploading file to MinIO');
      const institutionId = filters?.institutionId as string;
      const formatExt = format === ExportFormat.EXCEL ? 'xlsx' : format === ExportFormat.PDF ? 'pdf' : 'csv';

      const uploadResult = await this.fileStorage.uploadReport(fileBuffer, {
        institutionId,
        reportType,
        format: formatExt,
      });

      this.logger.log(`Upload complete. File size: ${uploadResult.size} bytes, URL: ${uploadResult.url}`);

      // Update report status to completed
      await this.updateReportStatus(
        reportId,
        ReportStatus.COMPLETED,
        uploadResult.url,
      );

      // Send notification to user (non-blocking)
      this.sendNotification(userId, reportType, uploadResult.url).catch((err) => {
        this.logger.warn(`Failed to send notification: ${err.message}`);
      });

      this.logger.log(`Report generation completed for job ${job.id}`);

      return {
        success: true,
        downloadUrl: uploadResult.url,
      };
    } catch (error) {
      this.logger.error(
        `Error processing report generation job ${job.id}:`,
        error,
      );

      // Update report status to failed
      await this.updateReportStatus(
        reportId,
        ReportStatus.FAILED,
        null,
        error.message,
      );

      throw error;
    }
  }

  /**
   * Update report status in database
   */
  private async updateReportStatus(
    reportId: string,
    status: ReportStatus,
    downloadUrl?: string,
    errorMessage?: string,
  ) {
    try {
      const updateData: Record<string, unknown> = {
        status: status,
      };

      if (status === ReportStatus.COMPLETED && downloadUrl) {
        updateData.fileUrl = downloadUrl;
        updateData.generatedAt = new Date();
      }

      if (status === ReportStatus.FAILED && errorMessage) {
        updateData.errorMessage = errorMessage;
      }

      await this.prisma.generatedReport.update({
        where: { id: reportId },
        data: updateData,
      });

      this.logger.log(`Report ${reportId} status updated to ${status}`);
    } catch (err) {
      this.logger.error(`Failed to update report status: ${err.message}`);
    }
  }

  /**
   * Get export configuration
   */
  private getExportConfig(
    reportType: string,
    data: any[],
    filters: any,
    userId: string,
    format: ExportFormat,
  ): ExportConfig {
    const reportTitles = {
      [ReportType.STUDENT_PROGRESS]: 'Student Progress Report',
      [ReportType.INTERNSHIP]: 'Internship Report',
      [ReportType.FACULTY_VISIT]: 'Faculty Visit Report',
      [ReportType.MONTHLY]: 'Monthly Report',
      [ReportType.PLACEMENT]: 'Placement Report',
      [ReportType.INSTITUTION_PERFORMANCE]: 'Institution Performance Report',
    };

    const reportColumns = {
      [ReportType.STUDENT_PROGRESS]: [
        { field: 'enrollmentNumber', header: 'Enrollment Number', type: 'string' as const },
        { field: 'name', header: 'Student Name', type: 'string' as const },
        { field: 'email', header: 'Email', type: 'string' as const },
        { field: 'department', header: 'Department', type: 'string' as const },
        { field: 'academicYear', header: 'Academic Year', type: 'string' as const },
        { field: 'semester', header: 'Semester', type: 'number' as const },
        { field: 'cgpa', header: 'CGPA', type: 'number' as const },
        { field: 'internshipsCount', header: 'Internships', type: 'number' as const },
        { field: 'placementsCount', header: 'Placements', type: 'number' as const },
        { field: 'status', header: 'Status', type: 'string' as const },
      ],
      [ReportType.INTERNSHIP]: [
        { field: 'studentName', header: 'Student Name', type: 'string' as const },
        { field: 'enrollmentNumber', header: 'Enrollment Number', type: 'string' as const },
        { field: 'department', header: 'Department', type: 'string' as const },
        { field: 'companyName', header: 'Company', type: 'string' as const },
        { field: 'designation', header: 'Designation', type: 'string' as const },
        { field: 'startDate', header: 'Start Date', type: 'date' as const },
        { field: 'endDate', header: 'End Date', type: 'date' as const },
        { field: 'duration', header: 'Duration (months)', type: 'number' as const },
        { field: 'status', header: 'Status', type: 'string' as const },
        { field: 'mentorName', header: 'Mentor', type: 'string' as const },
        { field: 'reportsSubmitted', header: 'Reports Submitted', type: 'number' as const },
      ],
      [ReportType.PLACEMENT]: [
        { field: 'studentName', header: 'Student Name', type: 'string' as const },
        { field: 'enrollmentNumber', header: 'Enrollment Number', type: 'string' as const },
        { field: 'department', header: 'Department', type: 'string' as const },
        { field: 'cgpa', header: 'CGPA', type: 'number' as const },
        { field: 'companyName', header: 'Company', type: 'string' as const },
        { field: 'designation', header: 'Designation', type: 'string' as const },
        { field: 'package', header: 'Package (LPA)', type: 'number' as const },
        { field: 'placementDate', header: 'Placement Date', type: 'date' as const },
        { field: 'location', header: 'Location', type: 'string' as const },
      ],
      [ReportType.FACULTY_VISIT]: [
        { field: 'facultyName', header: 'Faculty Name', type: 'string' as const },
        { field: 'department', header: 'Department', type: 'string' as const },
        { field: 'studentName', header: 'Student Name', type: 'string' as const },
        { field: 'companyName', header: 'Company', type: 'string' as const },
        { field: 'visitDate', header: 'Visit Date', type: 'date' as const },
        { field: 'purpose', header: 'Purpose', type: 'string' as const },
        { field: 'rating', header: 'Rating', type: 'number' as const },
        { field: 'status', header: 'Status', type: 'string' as const },
      ],
      [ReportType.MONTHLY]: [
        { field: 'studentName', header: 'Student Name', type: 'string' as const },
        { field: 'enrollmentNumber', header: 'Enrollment Number', type: 'string' as const },
        { field: 'companyName', header: 'Company', type: 'string' as const },
        { field: 'month', header: 'Month', type: 'number' as const },
        { field: 'year', header: 'Year', type: 'number' as const },
        { field: 'hoursWorked', header: 'Hours Worked', type: 'number' as const },
        { field: 'status', header: 'Status', type: 'string' as const },
        { field: 'submittedAt', header: 'Submitted At', type: 'date' as const },
      ],
      [ReportType.INSTITUTION_PERFORMANCE]: [
        { field: 'metric', header: 'Metric', type: 'string' as const },
        { field: 'value', header: 'Value', type: 'number' as const },
        { field: 'category', header: 'Category', type: 'string' as const },
      ],
    };

    return {
      title: reportTitles[reportType] || 'Report',
      columns: reportColumns[reportType] || [],
      data,
      format,
      metadata: {
        generatedAt: new Date(),
        generatedBy: userId,
        filters,
      },
    };
  }


  /**
   * Send notification to user
   */
  private async sendNotification(
    userId: string,
    reportType: string,
    downloadUrl: string,
  ) {
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          title: 'Report Generated',
          body: `Your ${reportType} report has been generated successfully.`,
          type: 'REPORT',
          data: {
            reportType,
            downloadUrl,
          },
        },
      });
    } catch (error) {
      this.logger.error('Error sending notification:', error);
      // Don't throw error, notification failure shouldn't fail the job
    }
  }
}
