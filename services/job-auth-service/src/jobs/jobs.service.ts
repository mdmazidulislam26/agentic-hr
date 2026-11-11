import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  // সাধারণ ক্যান্ডিডেটদের জন্য সব একটিভ জব ফেচ করা
  async getActivePublicJobs() {
    return this.prisma.jobPost.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createJob(hrId: string, dto: CreateJobDto) {
    return this.prisma.$transaction(async (tx) => {
      const job = await tx.jobPost.create({
        data: {
          hrId,
          title: dto.title,
          department: dto.department,
          jobDescription: dto.jobDescription,
          requirements: dto.requirements,
          deadline: new Date(dto.deadline),
          minAtsScoreThreshold: dto.minAtsScoreThreshold,
          hasAttitudeRound: dto.hasAttitudeRound,
          skipAssessmentAtStart: dto.skipAssessmentAtStart,
          slotDurationMinutes: dto.slotDurationMinutes,
          status: 'ACTIVE',
        },
      });

      if (dto.hasAttitudeRound && !dto.skipAssessmentAtStart) {
        await tx.assessmentConfig.create({
          data: {
            jobId: job.id,
            topics: dto.assessmentTopics || ['General Aptitude', 'Problem Solving'],
            totalQuestions: dto.totalAssessmentQuestions || 10,
            difficulty: dto.assessmentDifficulty || 'MEDIUM',
            source: 'AI_GENERATED',
          },
        });
      }

      return job;
    });
  }

  async getAllJobsForHr(hrId: string) {
    return this.prisma.jobPost.findMany({
      where: { hrId },
      include: {
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getJobById(jobId: string) {
    const job = await this.prisma.jobPost.findUnique({
      where: { id: jobId },
      include: { assessmentConfig: true },
    });
    if (!job) throw new NotFoundException('Job post not found.');
    return job;
  }
}
