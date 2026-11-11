import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { SlotBookingService } from './slot-booking.service';

@Controller('api/v1/jobs/:jobId/slots')
export class SlotBookingController {
  constructor(private slotService: SlotBookingService) {}

  @Post('generate')
  async generateSlots(
    @Param('jobId') jobId: string,
    @Body() body: { startDate: string; endDate: string; slotMinutes: number },
  ) {
    return this.slotService.generateSlotsForJob(
      jobId,
      new Date(body.startDate),
      new Date(body.endDate),
      body.slotMinutes || 15,
    );
  }

  @Get('available')
  async getAvailableSlots(@Param('jobId') jobId: string) {
    return this.slotService.getAvailableSlots(jobId);
  }

  @Post('book')
  async bookSlot(
    @Body() body: { candidateId: string; slotId: string },
  ) {
    return this.slotService.bookSlot(body.candidateId, body.slotId);
  }
}
