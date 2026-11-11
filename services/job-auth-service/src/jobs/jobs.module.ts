import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { FinalSelectionController } from './final-selection.controller';
import { PostRecruitmentPurgeService } from './data-purge.service';
import { DataPurgeController } from './data-purge.controller';
import { SlotBookingService } from '../interviews/slot-booking.service';
import { SlotBookingController } from '../interviews/slot-booking.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [
    JobsController,
    FinalSelectionController,
    DataPurgeController,
    SlotBookingController,
  ],
  providers: [
    JobsService,
    PostRecruitmentPurgeService,
    SlotBookingService,
    PrismaService,
  ],
  exports: [JobsService],
})
export class JobsModule {}
