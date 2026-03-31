import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Document } from '../entities/document.entity';
import { User } from '../entities/user.entity';
import { DocumentProcessor } from './document.processor';
import { DOCUMENT_QUEUE, DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { DocumentsGateway } from './documents.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, User]),
    AuthModule,
    BullModule.registerQueue({
      name: DOCUMENT_QUEUE,
    }),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentsGateway, DocumentProcessor],
  exports: [DocumentsService],
})
export class DocumentsModule {}
