import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { NotificationGateway } from './notification.gateway';
import { PrismaModule } from '../../core/database/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [ConfigModule, PrismaModule, MailModule],
  providers: [
    NotificationService,
    NotificationSchedulerService,
    NotificationGateway,
  ],
  exports: [
    NotificationService,
    NotificationSchedulerService,
    NotificationGateway,
  ],
})
export class NotificationModule {}
