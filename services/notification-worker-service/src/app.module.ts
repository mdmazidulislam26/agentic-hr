import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DeadlineWatcherCron } from './cron/deadline-watcher.cron';
import { CutoffPredictorAgent } from './agents/cutoff-predictor.service';
import { ShortlistPurgeController } from './controllers/shortlist-purge.controller';
import { EmailNotificationService } from './queue/email.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
  ],
  controllers: [ShortlistPurgeController],
  providers: [
    DeadlineWatcherCron,
    CutoffPredictorAgent,
    EmailNotificationService,
  ],
})
export class AppModule {}
