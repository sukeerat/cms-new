import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReportBuilderService } from './report-builder.service';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class ReportCleanupScheduler {
  private readonly logger = new Logger(ReportCleanupScheduler.name);

  constructor(
    private reportBuilderService: ReportBuilderService,
    private prisma: PrismaService,
  ) {}

  /**
   * Clean up expired reports daily at 3 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredReports(): Promise<void> {
    this.logger.log('Starting cleanup of expired reports');
    try {
      const result = await this.reportBuilderService.cleanupExpiredReports();
      this.logger.log(`Cleaned up ${result.count} expired reports`);
    } catch (error) {
      this.logger.error('Failed to cleanup expired reports', error.stack);
    }
  }

  /**
   * Clean up stale processing reports (stuck for more than 1 hour)
   * Runs every 30 minutes
   */
  @Cron('0 */30 * * * *')
  async cleanupStaleReports(): Promise<void> {
    this.logger.log('Checking for stale processing reports');
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const staleReports = await this.prisma.generatedReport.updateMany({
        where: {
          status: 'processing',
          createdAt: { lt: oneHourAgo },
        },
        data: {
          status: 'failed',
          errorMessage: 'Report processing timed out after 1 hour',
        },
      });

      if (staleReports.count > 0) {
        this.logger.warn(`Marked ${staleReports.count} stale reports as failed`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup stale reports', error.stack);
    }
  }

  /**
   * Clean up old failed/cancelled reports (older than 30 days)
   * Runs weekly on Sunday at 4 AM
   */
  @Cron('0 0 4 * * 0')
  async cleanupOldFailedReports(): Promise<void> {
    this.logger.log('Cleaning up old failed/cancelled reports');
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const result = await this.prisma.generatedReport.deleteMany({
        where: {
          status: { in: ['failed', 'cancelled'] },
          createdAt: { lt: thirtyDaysAgo },
        },
      });

      if (result.count > 0) {
        this.logger.log(`Deleted ${result.count} old failed/cancelled reports`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup old failed reports', error.stack);
    }
  }
}
