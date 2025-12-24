import { Module, forwardRef } from '@nestjs/common';
import { BulkStudentController } from './bulk-student.controller';
import { BulkStudentService } from './bulk-student.service';
import { PrismaModule } from '../../core/database/prisma.module';
import { UserModule } from '../../domain/user/user.module';
import { BulkModule } from '../bulk.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    forwardRef(() => BulkModule), // For BulkQueueService
  ],
  controllers: [BulkStudentController],
  providers: [BulkStudentService],
  exports: [BulkStudentService],
})
export class BulkStudentModule {}
