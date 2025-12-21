import { Module } from '@nestjs/common';
import { InstitutionService } from './institution.service';
import { CacheModule } from '../../core/cache/cache.module';

@Module({
  imports: [CacheModule],
  providers: [InstitutionService],
  exports: [InstitutionService],
})
export class InstitutionModule {}
