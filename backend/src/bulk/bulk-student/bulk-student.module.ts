import { Module } from '@nestjs/common';
import { BulkStudentController } from './bulk-student.controller';
import { BulkStudentService } from './bulk-student.service';
import { PrismaModule } from '../../core/database/prisma.module';
import { UserModule } from '../../domain/user/user.module';

@Module({
  imports: [PrismaModule, UserModule],
  controllers: [BulkStudentController],
  providers: [BulkStudentService],
  exports: [BulkStudentService],
})
export class BulkStudentModule {}
