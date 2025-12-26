import { Module } from '@nestjs/common';
import { IndustryController } from './industry.controller';
import { IndustryService } from './industry.service';
import { AuditModule } from '../../infrastructure/audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [IndustryController],
  providers: [IndustryService],
  exports: [IndustryService],
})
export class IndustryPortalModule {}
