import { Controller, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PostRecruitmentPurgeService } from './data-purge.service';

class PurgeConfirmationDto {
  confirmationToken: string;
}

@Controller('api/v1/jobs')
export class DataPurgeController {
  constructor(private purgeService: PostRecruitmentPurgeService) {}

  @Delete(':jobId/purge-all')
  @HttpCode(HttpStatus.OK)
  async purgeAllJobData(
    @Param('jobId') jobId: string,
    @Body() dto: PurgeConfirmationDto,
  ) {
    return this.purgeService.executeCompleteJobPurge(jobId, dto.confirmationToken);
  }
}
