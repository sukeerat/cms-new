import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { CacheModule } from '../../core/cache/cache.module';

@Module({
  imports: [CacheModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
