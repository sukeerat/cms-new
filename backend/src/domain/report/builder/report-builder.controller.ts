import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { ReportBuilderService } from './report-builder.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ReportHistoryDto } from './dto/report-history.dto';
import { FileStorageService } from '../../../infrastructure/file-storage/file-storage.service';

@Controller('shared/reports')
@UseGuards(JwtAuthGuard)
export class ReportBuilderController {
  private readonly logger = new Logger(ReportBuilderController.name);

  constructor(
    private reportBuilderService: ReportBuilderService,
    private fileStorageService: FileStorageService,
  ) {}

  // ==================== Health Check ====================

  /**
   * Check MinIO storage health
   */
  @Get('storage/health')
  async checkStorageHealth() {
    try {
      const isConnected = this.fileStorageService.isMinioConnected();
      return {
        success: true,
        data: {
          connected: isConnected,
          message: isConnected ? 'MinIO is connected' : 'MinIO is not connected',
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ==================== Catalog & Configuration (specific routes first) ====================

  /**
   * Get available report types grouped by category
   */
  @Get('catalog')
  async getReportCatalog(@Req() req: any) {
    const userRole = req.user.role;
    const catalog = this.reportBuilderService.getReportCatalog(userRole);
    return {
      success: true,
      data: catalog,
    };
  }

  /**
   * Get report configuration/filters
   */
  @Get('config/:type')
  async getReportConfig(@Param('type') type: string) {
    const config = this.reportBuilderService.getReportConfig(type);
    if (!config) {
      return {
        success: false,
        message: 'Report type not found',
      };
    }
    return {
      success: true,
      data: config,
    };
  }

  /**
   * Get dynamic filter values
   */
  @Get('filters/:reportType/:filterId')
  async getFilterValues(
    @Param('reportType') reportType: string,
    @Param('filterId') filterId: string,
    @Query('institutionId') institutionId?: string,
  ) {
    try {
      const values = await this.reportBuilderService.getFilterValues(
        reportType,
        filterId,
        institutionId,
      );
      return {
        success: true,
        data: values,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ==================== Template Endpoints (before :id routes) ====================

  /**
   * Get user's templates
   */
  @Get('templates/list')
  async getTemplates(
    @Req() req: any,
    @Query('reportType') reportType?: string,
  ) {
    const userId = req.user.userId;
    const templates = await this.reportBuilderService.getTemplates(
      userId,
      reportType,
    );

    return {
      success: true,
      data: templates,
    };
  }

  /**
   * Save report template
   */
  @Post('templates')
  async saveTemplate(@Req() req: any, @Body() body: any) {
    const userId = req.user.userId;

    const result = await this.reportBuilderService.saveTemplate(userId, {
      name: body.name,
      description: body.description,
      reportType: body.reportType,
      configuration: body.configuration,
      isPublic: body.isPublic,
    });

    return {
      success: true,
      message: 'Template saved successfully',
      data: result,
    };
  }

  /**
   * Delete template
   */
  @Delete('templates/:id')
  async deleteTemplate(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;

    await this.reportBuilderService.deleteTemplate(id, userId);

    return {
      success: true,
      message: 'Template deleted successfully',
    };
  }

  // ==================== Report Generation ====================

  /**
   * Queue report generation (async)
   */
  @Post('generate')
  async generateReport(@Req() req: any, @Body() dto: GenerateReportDto) {
    const userId = req.user.userId;
    const institutionId = req.user.institutionId;

    // Validate format
    const validFormats = ['excel', 'csv', 'pdf', 'json'] as const;
    const format = validFormats.includes(dto.format as any)
      ? (dto.format as 'excel' | 'csv' | 'pdf' | 'json')
      : 'excel';

    // Build config from DTO
    const config = {
      type: dto.type,
      columns: dto.columns || [],
      filters: {
        ...dto.filters,
        institutionId: dto.filters?.institutionId || institutionId,
      } as Record<string, unknown>,
      groupBy: dto.groupBy,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder,
      format,
    };

    const result = await this.reportBuilderService.queueReportGeneration(
      userId,
      dto.type,
      config,
    );

    return {
      success: true,
      message: 'Report generation queued successfully',
      data: result,
    };
  }

  /**
   * Generate report synchronously
   */
  @Post('generate-sync')
  async generateReportSync(@Req() req: any, @Body() dto: GenerateReportDto) {
    const userId = req.user.userId;
    const institutionId = req.user.institutionId;

    // Validate format
    const validFormats = ['excel', 'csv', 'pdf', 'json'] as const;
    const format = validFormats.includes(dto.format as any)
      ? (dto.format as 'excel' | 'csv' | 'pdf' | 'json')
      : 'excel';

    const config = {
      type: dto.type,
      columns: dto.columns || [],
      filters: {
        ...dto.filters,
        institutionId: dto.filters?.institutionId || institutionId,
      } as Record<string, unknown>,
      groupBy: dto.groupBy,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder,
      format,
    };

    const result = await this.reportBuilderService.generateReportSync(
      userId,
      dto.type,
      config,
    );

    return {
      success: true,
      data: result,
    };
  }

  // ==================== Queue Management ====================

  /**
   * Get queue statistics
   */
  @Get('queue/stats')
  async getQueueStats() {
    const stats = await this.reportBuilderService.getQueueStats();
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Get active/pending reports for current user
   */
  @Get('queue/active')
  async getActiveReports(@Req() req: any) {
    const userId = req.user.userId;
    const reports = await this.reportBuilderService.getActiveReports(userId);
    return {
      success: true,
      data: reports,
    };
  }

  /**
   * Get failed reports for current user
   */
  @Get('queue/failed')
  async getFailedReports(@Req() req: any) {
    const userId = req.user.userId;
    const reports = await this.reportBuilderService.getFailedReports(userId);
    return {
      success: true,
      data: reports,
    };
  }

  /**
   * Cancel a report
   */
  @Post('cancel/:id')
  async cancelReport(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    const result = await this.reportBuilderService.cancelReport(id, userId);
    return {
      success: true,
      ...result,
    };
  }

  /**
   * Retry a failed report
   */
  @Post('retry/:id')
  async retryReport(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    const result = await this.reportBuilderService.retryReport(id, userId);
    return {
      success: true,
      ...result,
    };
  }

  /**
   * Delete a report
   */
  @Delete('report/:id')
  async deleteReport(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    const result = await this.reportBuilderService.deleteReport(id, userId);
    return {
      success: true,
      ...result,
    };
  }

  // ==================== Report History (root route) ====================

  /**
   * Get user's report history
   */
  @Get()
  async getReportHistory(@Req() req: any, @Query() query: ReportHistoryDto) {
    const userId = req.user.userId;
    const pagination = {
      page: query.page || 1,
      limit: query.limit || 10,
    };

    const result = await this.reportBuilderService.getReportHistory(
      userId,
      pagination,
    );

    return {
      success: true,
      data: result,
    };
  }

  // ==================== Report by ID (parameterized routes last) ====================

  /**
   * Get report status (lightweight)
   */
  @Get(':id/status')
  async getReportStatus(@Param('id') id: string) {
    const report = await this.reportBuilderService.getReportStatus(id);

    if (!report) {
      return {
        success: false,
        message: 'Report not found',
      };
    }

    return {
      success: true,
      data: report,
    };
  }

  /**
   * Download generated report - streams file from MinIO
   */
  @Get(':id/download')
  async downloadReport(@Param('id') id: string, @Res() res: Response) {
    const report = await this.reportBuilderService.getReportStatus(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    if (report.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Report is not ready for download',
        status: report.status,
      });
    }

    if (!report.fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Report file not available',
      });
    }

    try {
      // Extract file key from URL
      // URL format: http://localhost:9000/bucket-name/path/to/file.xlsx
      this.logger.log(`Processing download for fileUrl: ${report.fileUrl}`);

      const url = new URL(report.fileUrl);
      const pathParts = url.pathname.split('/');
      this.logger.log(`URL pathname: ${url.pathname}`);
      this.logger.log(`Path parts: ${JSON.stringify(pathParts)}`);

      // Remove empty first element and bucket name
      const fileKey = pathParts.slice(2).join('/');
      this.logger.log(`Extracted file key: ${fileKey}`);
      this.logger.log(`MinIO connected: ${this.fileStorageService.isMinioConnected()}`);

      // Get file from MinIO
      const fileBuffer = await this.fileStorageService.getFile(fileKey);

      // Determine content type and filename
      const extension = report.format === 'excel' ? 'xlsx' : report.format;
      const contentTypes: Record<string, string> = {
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        pdf: 'application/pdf',
        csv: 'text/csv',
      };
      const contentType = contentTypes[extension] || 'application/octet-stream';
      const filename = `${report.type}_${new Date().toISOString().split('T')[0]}.${extension}`;

      // Set headers for file download
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', fileBuffer.length);

      // Send the file
      return res.send(fileBuffer);
    } catch (error) {
      this.logger.error(`Failed to download report: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to download report file',
        error: error.message,
      });
    }
  }

  /**
   * Get full report details (must be last to not catch other routes)
   */
  @Get(':id')
  async getReport(@Param('id') id: string) {
    const report = await this.reportBuilderService.getReportStatus(id);

    if (!report) {
      return {
        success: false,
        message: 'Report not found',
      };
    }

    return {
      success: true,
      data: report,
    };
  }
}
