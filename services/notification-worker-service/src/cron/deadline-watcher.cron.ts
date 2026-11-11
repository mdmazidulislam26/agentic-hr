import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';
import { CutoffPredictorAgent } from '../agents/cutoff-predictor.service';
import { Resend } from 'resend';

@Injectable()
export class DeadlineWatcherCron {
  private readonly logger = new Logger(DeadlineWatcherCron.name);
  private prisma: PrismaClient;
  private resend: Resend;

  constructor(private cutoffAgent: CutoffPredictorAgent) {
    this.prisma = new PrismaClient();
    this.resend = new Resend(process.env.RESEND_API_KEY || 're_default_key');
  }

  // Poll database every minute to flag expired job requisitions
  @Cron(CronExpression.EVERY_MINUTE)
  async checkJobDeadlines() {
    const now = new Date();

    const expiredJobs = await this.prisma.jobPost.findMany({
      where: {
        deadline: { lte: now },
        status: 'ACTIVE',
      },
      include: {
        hr: true,
        applications: {
          where: { status: 'ATS_QUALIFIED' },
          select: { atsScore: true },
        },
      },
    });

    for (const job of expiredJobs) {
      this.logger.log(`Processing expired deadline for Job: "${job.title}" (${job.id})`);

      const scores = job.applications.map((app) => app.atsScore);
      const prediction = await this.cutoffAgent.predictOptimalCutoff(job.title, scores);

      // Transition job state to DEADLINE_REACHED
      await this.prisma.jobPost.update({
        where: { id: job.id },
        data: {
          status: 'DEADLINE_REACHED',
          predictedCutoffX: prediction.predictedCutoffPercentage,
        },
      });

      // Dispatch notification email to HR recruiter
      await this.resend.emails.send({
        from: 'Agentic HR <onboarding@resend.dev>',
        to: job.hr.email,
        subject: `[Action Required] Application Deadline Ended for "${job.title}"`,
        html: `
          <h2>Application Deadline Reached</h2>
          <p>Hello ${job.hr.name},</p>
          <p>Applications for <strong>${job.title}</strong> are now closed.</p>
          <p>Total Qualified Applicants: <strong>${scores.length}</strong></p>
          <hr />
          <h3>Autonomous Agent Cutoff Recommendation:</h3>
          <p>Recommended Cutoff: <strong>Top ${prediction.predictedCutoffPercentage}%</strong></p>
          <p><em>${prediction.reason}</em></p>
          <br />
          <p>Please log in to your HR Dashboard to approve this recommendation or supply a custom filter.</p>
        `,
      });

      this.logger.log(`HR notified successfully for Job ID: ${job.id}`);
    }
  }
}
