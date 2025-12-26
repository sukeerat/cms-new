import { Module } from '@nestjs/common';
import { StateController } from './state.controller';
import { StateService } from './state.service';

// Import domain modules for business logic reuse
import { InternshipModule } from '../../domain/internship/internship.module';
import { PlacementModule } from '../../domain/placement/placement.module';
import { ReportModule } from '../../domain/report/report.module';
import { MentorModule } from '../../domain/mentor/mentor.module';
import { AcademicModule } from '../../domain/academic/academic.module';
import { InstitutionModule } from '../../domain/institution/institution.module';
import { UserModule } from '../../domain/user/user.module';
import { AuditModule } from '../../infrastructure/audit/audit.module';

@Module({
  imports: [
    // Domain modules with business logic services
    InternshipModule,
    PlacementModule,
    ReportModule,
    MentorModule,
    AcademicModule,
    InstitutionModule,
    UserModule,
    AuditModule,
  ],
  controllers: [StateController],
  providers: [StateService],
  exports: [StateService],
})
export class StateModule {}
