import { Module, forwardRef } from '@nestjs/common';
import { BulkUserController } from './bulk-user.controller';
import { BulkUserService } from './bulk-user.service';
import { PrismaModule } from '../../core/database/prisma.module';
import { BulkModule } from '../bulk.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => BulkModule), // For BulkQueueService
  ],
  controllers: [BulkUserController],
  providers: [BulkUserService],
  exports: [BulkUserService],
})
export class BulkUserModule {}
