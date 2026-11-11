import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SlotBookingService {
  constructor(private prisma: PrismaService) {}

  // Generate sequential booking slots within HR designated date boundaries
  async generateSlotsForJob(jobId: string, startDate: Date, endDate: Date, slotMinutes: number) {
    const slotsData = [];
    let current = new Date(startDate);

    while (current < endDate) {
      const hours = current.getHours();
      // Schedule windows between 10 AM and 5 PM
      if (hours >= 10 && hours < 17) {
        const slotEnd = new Date(current.getTime() + slotMinutes * 60000);
        slotsData.push({
          jobId,
          startTime: new Date(current),
          endTime: slotEnd,
          isBooked: false,
        });
      }
      current = new Date(current.getTime() + slotMinutes * 60000);
    }

    return this.prisma.interviewSlot.createMany({
      data: slotsData,
      skipDuplicates: true,
    });
  }

  // Reserve slot for a specific candidate
  async bookSlot(candidateId: string, slotId: string) {
    return this.prisma.$transaction(async (tx) => {
      const slot = await tx.interviewSlot.findUnique({ where: { id: slotId } });
      if (!slot || slot.isBooked) {
        throw new BadRequestException('Selected time slot is no longer available.');
      }

      const updatedSlot = await tx.interviewSlot.update({
        where: { id: slotId },
        data: {
          isBooked: true,
          candidateId: candidateId,
        },
      });

      await tx.candidateApplication.update({
        where: { id: candidateId },
        data: { status: 'INTERVIEW_SCHEDULED' },
      });

      return updatedSlot;
    });
  }

  // Retrieve unbooked slots for a job
  async getAvailableSlots(jobId: string) {
    return this.prisma.interviewSlot.findMany({
      where: {
        jobId,
        isBooked: false,
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: 'asc' },
    });
  }
}
