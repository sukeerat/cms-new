import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportBuilderController } from './report-builder.controller';
import { ReportBuilderService } from './report-builder.service';
import { ReportGeneratorService } from './report-generator.service';
import { ExcelService } from './export/excel.service';
import { PdfService } from './export/pdf.service';
import { CsvService } from './export/csv.service';
import { ReportProcessor } from './report.processor';
import { ReportCleanupScheduler } from './report-cleanup.scheduler';
import { PrismaModule } from '../../../core/database/prisma.module';
import { FileStorageModule } from '../../../infrastructure/file-storage/file-storage.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'report-generation',
    }),
    PrismaModule,
    FileStorageModule,
  ],
  controllers: [ReportBuilderController],
  providers: [
    ReportBuilderService,
    ReportGeneratorService,
    ExcelService,
    PdfService,
    CsvService,
    ReportProcessor,
    ReportCleanupScheduler,
  ],
  exports: [ReportBuilderService],
})
export class ReportBuilderModule {}
