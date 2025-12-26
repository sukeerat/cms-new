import { Module } from '@nestjs/common';
import { InternshipApplicationService } from './application/internship-application.service';
import { SelfIdentifiedService } from './self-identified/self-identified.service';
import { InternshipPostingService } from './posting/internship-posting.service';
import { AuditModule } from '../../infrastructure/audit/audit.module';
import { SystemAdminModule } from '../../api/system-admin/system-admin.module';

@Module({
  imports: [AuditModule, SystemAdminModule],
  providers: [
    InternshipApplicationService,
    SelfIdentifiedService,
    InternshipPostingService,
  ],
  exports: [
    InternshipApplicationService,
    SelfIdentifiedService,
    InternshipPostingService,
  ],
})
export class InternshipModule {}
