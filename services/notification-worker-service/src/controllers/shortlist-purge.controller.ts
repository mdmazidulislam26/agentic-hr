import { Controller, Post, Body, Param, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

class CutoffActionDto {
  useAiRecommendation: boolean;
  customPercentage?: number;
  customTopCount?: number;
}

@Controller('api/v1/jobs')
export class ShortlistPurgeController {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Applies selected cutoff and executes zero-junk purge of non-shortlisted applicants
  @Post(':jobId/apply-cutoff')
  async applyCutoffAndPurgeUnselected(
    @Param('jobId') jobId: string,
    @Body() dto: CutoffActionDto,
  ) {
    const job = await this.prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        applications: {
          where: { status: 'ATS_QUALIFIED' },
          orderBy: { atsScore: 'desc' },
        },
      },
    });

    if (!job || job.status !== 'DEADLINE_REACHED') {
      throw new BadRequestException('Job is not eligible for cutoff processing.');
    }

    const totalApps = job.applications.length;
    let targetCount = 0;

    if (dto.useAiRecommendation) {
      const percentage = job.predictedCutoffX || 25;
      targetCount = Math.ceil((percentage / 100) * totalApps);
    } else if (dto.customPercentage) {
      targetCount = Math.ceil((dto.customPercentage / 100) * totalApps);
    } else if (dto.customTopCount) {
      targetCount = Math.min(dto.customTopCount, totalApps);
    } else {
      throw new BadRequestException('Please provide valid cutoff parameters.');
    }

    const shortlisted = job.applications.slice(0, targetCount);
    const shortlistedIds = shortlisted.map((c) => c.id);

    return this.prisma.$transaction(async (tx) => {
      // 1. Advance top applicants to SHORTLISTED
      await tx.candidateApplication.updateMany({
        where: { id: { in: shortlistedIds } },
        data: { status: 'SHORTLISTED' },
      });

      // 2. Permanently prune unselected applicants from database
      const deleteResult = await tx.candidateApplication.deleteMany({
        where: {
          jobId: jobId,
          id: { notIn: shortlistedIds },
        },
      });

      // 3. Update job lifecycle state
      await tx.jobPost.update({
        where: { id: jobId },
        data: {
          status: 'SHORTLISTING_COMPLETED',
          finalCutoffApplied: (targetCount / (totalApps || 1)) * 100,
        },
      });

      return {
        message: 'Cutoff applied successfully. Unselected applicants purged.',
        shortlistedCount: shortlisted.length,
        purgedRecordsCount: deleteResult.count,
      };
    });
  }
}
