import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostRecruitmentPurgeService {
  private readonly logger = new Logger(PostRecruitmentPurgeService.name);

  constructor(private prisma: PrismaService) {}

  // Irreversibly wipe all data associated with a completed job requisition
  async executeCompleteJobPurge(jobId: string, hrConfirmationSecret: string) {
    const job = await this.prisma.jobPost.findUnique({
      where: { id: jobId },
      include: { applications: true },
    });

    if (!job) throw new BadRequestException('Job post does not exist.');

    if (hrConfirmationSecret !== `PURGE_ALL_DATA_${jobId}`) {
      throw new BadRequestException('Invalid confirmation token. Operation aborted.');
    }

    this.logger.warn(`Purging all records for Job: "${job.title}" (${job.id})`);

    return this.prisma.$transaction(async (tx) => {
      const totalCandidates = job.applications.length;

      // Cascading deletion cleanses all child records
      await tx.jobPost.delete({
        where: { id: jobId },
      });

      return {
        success: true,
        message: 'Job and all associated records purged successfully.',
        deletedJobTitle: job.title,
        purgedRecordsCount: totalCandidates,
      };
    });
  }
}
