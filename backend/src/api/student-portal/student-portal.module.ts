import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { ReportModule } from '../../domain/report/report.module';
import { AuditModule } from '../../infrastructure/audit/audit.module';

@Module({
  imports: [ReportModule, AuditModule],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentPortalModule {}
