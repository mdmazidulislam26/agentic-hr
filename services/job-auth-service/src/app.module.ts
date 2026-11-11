import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { JobsModule } from './jobs/jobs.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [AuthModule, JobsModule],
  providers: [PrismaService],
})
export class AppModule {}
