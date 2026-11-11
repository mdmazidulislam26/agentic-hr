import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';

@Controller('api/v1/jobs')
export class JobsController {
  constructor(private jobsService: JobsService) {}

  // পাবলিক ক্যারিয়ার বোর্ডের জন্য
  @Get()
  async getPublicJobs() {
    return this.jobsService.getActivePublicJobs();
  }

  @Post()
  async createJob(@Body() body: { hrId: string; jobData: CreateJobDto }) {
    return this.jobsService.createJob(body.hrId, body.jobData);
  }

  @Get('hr/:hrId')
  async getHrJobs(@Param('hrId') hrId: string) {
    return this.jobsService.getAllJobsForHr(hrId);
  }

  @Get(':id')
  async getJob(@Param('id') id: string) {
    return this.jobsService.getJobById(id);
  }
}
