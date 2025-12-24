import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BulkUserModule } from './bulk-user/bulk-user.module';
import { BulkStudentModule } from './bulk-student/bulk-student.module';
import { BulkInstitutionModule } from './bulk-institution/bulk-institution.module';
import { TemplateController } from './templates/template.controller';
import { BulkValidationService } from './shared/bulk-validation.service';
import { BulkProcessor } from './shared/bulk.processor';
import { BulkJobService } from './shared/bulk-job.service';
import { BulkQueueService } from './shared/bulk-queue.service';
import { BulkJobController } from './shared/bulk-job.controller';
import { PrismaModule } from '../core/database/prisma.module';
import { BulkUserService } from './bulk-user/bulk-user.service';
import { BulkStudentService } from './bulk-student/bulk-student.service';
import { BulkInstitutionService } from './bulk-institution/bulk-institution.service';
import { BulkSelfInternshipService } from './bulk-self-internship/bulk-self-internship.service';
import { BulkSelfInternshipController } from './bulk-self-internship/bulk-self-internship.controller';

@Module({
  imports: [
    PrismaModule,
    BulkUserModule,
    BulkStudentModule,
    BulkInstitutionModule,
    BullModule.registerQueue({
      name: 'bulk-operations',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          count: 100,
          age: 24 * 3600,
        },
        removeOnFail: {
          count: 50,
        },
      },
    }),
  ],
  controllers: [TemplateController, BulkJobController, BulkSelfInternshipController],
  providers: [
    BulkValidationService,
    BulkJobService,
    BulkQueueService,
    BulkSelfInternshipService,
    BulkProcessor,
  ],
  exports: [
    BulkUserModule,
    BulkStudentModule,
    BulkInstitutionModule,
    BulkValidationService,
    BulkJobService,
    BulkQueueService,
    BulkSelfInternshipService,
  ],
})
export class BulkModule {}
