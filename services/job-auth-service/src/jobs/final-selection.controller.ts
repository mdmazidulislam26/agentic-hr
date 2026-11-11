import { Controller, Get, Post, Param, Body, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import { IsArray, IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

class InviteExamDto {
  @IsArray()
  @IsString({ each: true })
  selectedCandidateIds: string[];

  @IsOptional()
  @IsString()
  examStartTime?: string;

  @IsOptional()
  @IsString()
  examDateText?: string;

  @IsOptional()
  @IsNumber()
  examDurationMinutes?: number;
}

class SetPassMarkDto {
  @IsNumber()
  passMarks: number;
}

class DispatchInterviewDto {
  @IsDateString()
  interviewStartDate: string;

  @IsDateString()
  interviewEndDate: string;

  @IsNumber()
  @IsOptional()
  slotDurationMinutes?: number;
}

class InviteF2FDto {
  @IsArray()
  @IsString({ each: true })
  selectedCandidateIds: string[];

  @IsString()
  interviewType: string; // 'IN_PERSON' | 'VIRTUAL'

  @IsString()
  scheduledDateTime: string;

  @IsString()
  venueOrLink: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

@Controller('api/v1/jobs')
export class FinalSelectionController {
  private transporter: nodemailer.Transporter;

  constructor(private prisma: PrismaService) {
    const userEmail = process.env.SMTP_EMAIL || 'mazid9326@gmail.com';
    const userPass = (process.env.SMTP_PASSWORD || '').replace(/\s+/g, '');

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: userEmail, pass: userPass },
    });
  }

  @Get(':jobId/leaderboard')
  async getCandidateLeaderboard(@Param('jobId') jobId: string) {
    return this.prisma.candidateApplication.findMany({
      where: { jobId },
      include: {
        interviewEvaluation: true,
        examResult: true,
      },
      orderBy: { atsScore: 'desc' },
    });
  }

  @Post(':jobId/invite-exam')
  async inviteToExam(
    @Param('jobId') jobId: string,
    @Body() dto: InviteExamDto,
  ) {
    const job = await this.prisma.jobPost.findUnique({
      where: { id: jobId },
      include: { assessmentConfig: true, hr: true },
    });

    if (!job) throw new BadRequestException('Job post not found.');

    const rawTime = dto.examStartTime || dto.examDateText || new Date().toISOString();
    const examDate = new Date(rawTime);
    const duration = dto.examDurationMinutes || 30;

    let configId = job.assessmentConfig?.id;
    if (!configId) {
      const newConfig = await this.prisma.assessmentConfig.create({
        data: {
          jobId: job.id,
          topics: ['Problem Solving', 'Python & AI Fundamentals'],
          totalQuestions: 5,
          difficulty: 'MEDIUM',
          examDate: isNaN(examDate.getTime()) ? new Date() : examDate,
          durationMinutes: duration,
        },
      });
      configId = newConfig.id;
    } else {
      await this.prisma.assessmentConfig.update({
        where: { id: configId },
        data: {
          examDate: isNaN(examDate.getTime()) ? new Date() : examDate,
          durationMinutes: duration,
        },
      });
    }

    const candidates = await this.prisma.candidateApplication.findMany({
      where: { id: { in: dto.selectedCandidateIds }, jobId },
    });

    const senderEmail = process.env.SMTP_EMAIL || 'mazid9326@gmail.com';
    const readableDate = isNaN(examDate.getTime()) 
      ? (dto.examDateText || rawTime) 
      : examDate.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });

    for (const candidate of candidates) {
      const tempPassword = 'EX' + Math.random().toString(36).substring(2, 6).toUpperCase();

      await this.prisma.candidateApplication.update({
        where: { id: candidate.id },
        data: {
          status: 'EXAM_INVITED',
          examPassword: tempPassword,
          examRoomActive: true,
        },
      });

      try {
        await this.transporter.sendMail({
          from: `"Agentic HR Recruitment" <${senderEmail}>`,
          to: candidate.email,
          subject: `[Assessment Round] Aptitude & Technical Exam for "${job.title}"`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
              <h2 style="color: #4f46e5; margin-top: 0;">Attitude & Technical Assessment Invitation</h2>
              <p>Dear <strong>${candidate.fullName}</strong>,</p>
              <p>You have been shortlisted for the assessment round for <strong>${job.title}</strong>.</p>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 4px 0;">📅 <strong>Scheduled Exam Date & Time:</strong> ${readableDate}</p>
                <p style="margin: 4px 0;">⏱️ <strong>Duration:</strong> ${duration} Minutes</p>
                <p style="margin: 4px 0;">🔑 <strong>Your Temporary Exam Password:</strong> <span style="font-family: monospace; font-size: 16px; font-weight: bold; color: #4f46e5; background: #e0e7ff; padding: 2px 6px; border-radius: 4px;">${tempPassword}</span></p>
              </div>
            </div>
          `,
        });
      } catch (err: any) {
        console.error(`[Email Error]:`, err?.message || err);
      }
    }

    return {
      success: true,
      message: `Exam invitations successfully dispatched to ${candidates.length} candidate(s).`,
      examLink: `/exam/${configId}`,
    };
  }

  @Post('exam/verify-access')
  async verifyExamAccess(@Body() body: { configId: string; email: string; password: string }) {
    let config = await this.prisma.assessmentConfig.findUnique({
      where: { id: body.configId },
      include: { job: true },
    });

    if (!config) {
      config = await this.prisma.assessmentConfig.findFirst({
        where: { jobId: body.configId },
        include: { job: true },
      });
    }

    if (!config) throw new BadRequestException('Exam session not found.');

    const candidate = await this.prisma.candidateApplication.findFirst({
      where: {
        jobId: config.jobId,
        email: { equals: body.email.trim(), mode: 'insensitive' },
      },
    });

    if (!candidate || candidate.examPassword !== body.password.trim().toUpperCase()) {
      throw new BadRequestException('Invalid registered email or temporary exam password.');
    }

    if (!candidate.examRoomActive) {
      throw new BadRequestException('Exam session has expired.');
    }

    const now = new Date();
    const examStart = config.examDate ? new Date(config.examDate) : new Date();
    const tenMinutesBefore = new Date(examStart.getTime() - 10 * 60000);
    const examEnd = new Date(examStart.getTime() + (config.durationMinutes || 30) * 60000);

    if (now > examEnd) throw new BadRequestException('The scheduled exam window has completely closed.');
    if (now < tenMinutesBefore) {
      const waitMinutes = Math.ceil((tenMinutesBefore.getTime() - now.getTime()) / 60000);
      throw new BadRequestException(`Waiting room opens 10 minutes prior to exam time. Please return in ${waitMinutes} minute(s).`);
    }

    return {
      success: true,
      candidateId: candidate.id,
      fullName: candidate.fullName,
      examStartTime: examStart.toISOString(),
      durationMinutes: config.durationMinutes,
      canStartNow: now >= examStart,
      secondsUntilStart: Math.max(0, Math.floor((examStart.getTime() - now.getTime()) / 1000)),
    };
  }

  @Post('exam/submit-answers')
  async submitExamAnswers(@Body() body: { candidateId: string; score: number }) {
    await this.prisma.candidateApplication.update({
      where: { id: body.candidateId },
      data: { examRoomActive: false },
    });

    await this.prisma.candidateExamResult.upsert({
      where: { applicationId: body.candidateId },
      update: { obtainedScore: body.score, isPassed: body.score >= 60, isAttended: true },
      create: {
        applicationId: body.candidateId,
        totalQuestions: 5,
        correctAnswers: Math.round((body.score / 100) * 5),
        obtainedScore: body.score,
        isPassed: body.score >= 60,
        isAttended: true,
      },
    });

    return { success: true, message: 'Exam submitted.' };
  }

  @Post(':jobId/set-passmark-and-purge')
  async setPassMarkAndPurge(@Param('jobId') jobId: string, @Body() dto: SetPassMarkDto) {
    return this.prisma.$transaction(async (tx) => {
      await tx.assessmentConfig.updateMany({
        where: { jobId },
        data: { passMarks: dto.passMarks },
      });

      const absentDeleted = await tx.candidateApplication.deleteMany({
        where: { jobId, status: 'EXAM_INVITED', examResult: null },
      });

      const failedCandidates = await tx.candidateApplication.findMany({
        where: { jobId, examResult: { obtainedScore: { lt: dto.passMarks } } },
        select: { id: true },
      });

      const failedDeleted = await tx.candidateApplication.deleteMany({
        where: { id: { in: failedCandidates.map((c) => c.id) } },
      });

      await tx.candidateApplication.updateMany({
        where: { jobId, examResult: { obtainedScore: { gte: dto.passMarks } } },
        data: { status: 'EXAM_PASSED' },
      });

      return {
        success: true,
        message: `Pass mark set to ${dto.passMarks}%. Purged ${absentDeleted.count} absent and ${failedDeleted.count} unqualified applicants.`,
      };
    });
  }

  @Post(':jobId/dispatch-interview-invites')
  async dispatchInterviewInvites(@Param('jobId') jobId: string, @Body() dto: DispatchInterviewDto) {
    const passedCandidates = await this.prisma.candidateApplication.findMany({
      where: { jobId, status: 'EXAM_PASSED' },
    });

    for (const candidate of passedCandidates) {
      await this.prisma.candidateApplication.update({
        where: { id: candidate.id },
        data: { status: 'SLOT_BOOKING_PENDING' },
      });
    }

    return { success: true, message: `Interview invitations dispatched to ${passedCandidates.length} candidate(s).` };
  }

  @Post('interview/book-custom-slot')
  async bookCustomSlot(@Body() body: { candidateId: string; selectedDateTime: string }) {
    const candidate = await this.prisma.candidateApplication.findUnique({
      where: { id: body.candidateId },
      include: { job: true },
    });
    if (!candidate) throw new BadRequestException('Candidate record not found.');

    const startTime = new Date(body.selectedDateTime);
    const duration = candidate.job.slotDurationMinutes || 15;
    const endTime = new Date(startTime.getTime() + duration * 60000);

    await this.prisma.interviewSlot.deleteMany({ where: { candidateId: candidate.id } });

    const slot = await this.prisma.interviewSlot.create({
      data: { jobId: candidate.jobId, candidateId: candidate.id, startTime, endTime, isBooked: true },
    });

    await this.prisma.candidateApplication.update({
      where: { id: candidate.id },
      data: { status: 'INTERVIEW_SCHEDULED' },
    });

    return { success: true, message: 'Slot confirmed.', slot };
  }

  @Get('interview/check-access/:candidateId')
  async checkInterviewAccess(@Param('candidateId') candidateId: string) {
    const candidate = await this.prisma.candidateApplication.findUnique({
      where: { id: candidateId },
      include: { interviewSlot: true, job: true },
    });
    if (!candidate || !candidate.interviewSlot) return { hasSlot: false };

    const now = new Date();
    const start = new Date(candidate.interviewSlot.startTime);
    const end = new Date(candidate.interviewSlot.endTime);
    const tenMinBefore = new Date(start.getTime() - 10 * 60000);

    let state = 'WAITING';
    if (now > end) state = 'EXPIRED';
    else if (now < tenMinBefore) state = 'TOO_EARLY';
    else if (now >= tenMinBefore && now < start) state = 'DEVICE_TEST';
    else state = 'LIVE_NOW';

    return {
      hasSlot: true,
      state,
      candidateName: candidate.fullName,
      jobTitle: candidate.job.title,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      secondsUntilStart: Math.max(0, Math.floor((start.getTime() - now.getTime()) / 1000)),
      waitMinutes: Math.max(0, Math.ceil((tenMinBefore.getTime() - now.getTime()) / 60000)),
    };
  }

  // 🤝 চূড়ান্ত F2F ইন্টারভিউ সিলেকশন ও ইমেইল ইনভিটেশন
  @Post(':jobId/select-f2f')
  async inviteToFaceToFace(
    @Param('jobId') jobId: string,
    @Body() dto: InviteF2FDto,
  ) {
    const job = await this.prisma.jobPost.findUnique({
      where: { id: jobId },
      include: { hr: true },
    });
    if (!job) throw new BadRequestException('Job requisition not found.');

    const candidates = await this.prisma.candidateApplication.findMany({
      where: { id: { in: dto.selectedCandidateIds }, jobId },
    });

    // ১. স্ট্যাটাস আপডেট
    await this.prisma.candidateApplication.updateMany({
      where: { id: { in: dto.selectedCandidateIds }, jobId },
      data: { status: 'SELECTED_FOR_F2F' },
    });

    await this.prisma.interviewEvaluation.updateMany({
      where: { applicationId: { in: dto.selectedCandidateIds } },
      data: { f2fSelectedByHr: true },
    });

    // ২. প্রতিটি প্রার্থীকে অফিশিয়াল F2F ইমেইল লেটার পাঠানো
    const senderEmail = process.env.SMTP_EMAIL || 'mazid9326@gmail.com';
    const readableDate = new Date(dto.scheduledDateTime).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
    const isVirtual = dto.interviewType === 'VIRTUAL';

    for (const candidate of candidates) {
      try {
        await this.transporter.sendMail({
          from: `"Autonomous HR Board" <${senderEmail}>`,
          to: candidate.email,
          subject: `🎉 Final Face-to-Face (F2F) Interview Invitation for "${job.title}"`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 620px; margin: auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
              <h2 style="color: #4f46e5; margin-top: 0; font-size: 22px;">Executive Face-to-Face Interview Invitation</h2>
              <p style="font-size: 15px; color: #334155;">Dear <strong>${candidate.fullName}</strong>,</p>
              <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                Congratulations! Based on your outstanding performance in our <strong>ATS Screening, Technical Assessment Exam</strong>, and the <strong>Autonomous AI Interview</strong>, our hiring committee has officially selected you for the final <strong>Face-to-Face (F2F) Executive Round</strong> for the role of <strong>${job.title}</strong>.
              </p>

              <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <h3 style="margin-top: 0; color: #1e293b; font-size: 15px; border-bottom: 1px solid #e2e8f0; pb: 8px;">Appointment Schedule Details</h3>
                <p style="margin: 8px 0; font-size: 14px;">📅 <strong>Date & Time:</strong> <span style="color: #4f46e5; font-weight: bold;">${readableDate}</span></p>
                <p style="margin: 8px 0; font-size: 14px;">🏢 <strong>Interview Mode:</strong> <span style="background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 6px; font-weight: bold;">${isVirtual ? 'Virtual (Executive Video Conference)' : 'In-Person (Corporate Office)'}</span></p>
                <p style="margin: 8px 0; font-size: 14px;">📍 <strong>${isVirtual ? 'Meeting Link' : 'Office Venue'}:</strong> <a href="${dto.venueOrLink}" style="color: #2563eb; font-weight: bold;">${dto.venueOrLink}</a></p>
                ${dto.contactPerson ? `<p style="margin: 8px 0; font-size: 14px;">👤 <strong>Contact Person:</strong> ${dto.contactPerson}</p>` : ''}
              </div>

              ${dto.notes ? `
                <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px; font-size: 13px; color: #92400e; margin-bottom: 20px;">
                  <strong>Special Instructions:</strong> ${dto.notes}
                </div>
              ` : ''}

              <p style="font-size: 14px; color: #64748b;">
                Please be prepared 10 minutes prior to the scheduled time. We look forward to meeting you!
              </p>
              <br />
              <p style="font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px;">
                Talent Acquisition & Hiring Committee<br />
                <strong>${job.hr.companyName || 'Autonomous Agentic HR Ecosystem'}</strong>
              </p>
            </div>
          `,
        });
        console.log(`[F2F Invite Sent] -> ${candidate.email}`);
      } catch (mailErr: any) {
        console.error(`[F2F Mail Error]:`, mailErr?.message || mailErr);
      }
    }

    return {
      success: true,
      message: `F2F Interview Invitations dispatched to ${candidates.length} candidate(s)!`,
      count: candidates.length,
    };
  }
}
