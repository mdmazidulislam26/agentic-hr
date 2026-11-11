import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Connect to the database on initialization
  async onModuleInit() {
    await this.$connect();
  }

  // Gracefully close connection on destruction
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
