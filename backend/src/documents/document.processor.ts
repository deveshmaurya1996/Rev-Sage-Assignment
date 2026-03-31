import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, UnrecoverableError } from 'bullmq';
import { Repository } from 'typeorm';
import { Document } from '../entities/document.entity';
import { DocumentStatus } from '../entities/document-status.enum';
import { User } from '../entities/user.entity';
import { DOCUMENT_QUEUE, DocumentsService } from './documents.service';

function randomSleepMs(): number {
  return 5000 + Math.floor(Math.random() * 5001);
}

@Processor(DOCUMENT_QUEUE)
export class DocumentProcessor extends WorkerHost {
  constructor(
    private readonly documentsService: DocumentsService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Document)
    private readonly docRepo: Repository<Document>,
  ) {
    super();
  }

  async process(job: Job<{ documentId: string }>): Promise<void> {
    const { documentId } = job.data;

    let doc = await this.docRepo.findOne({ where: { id: documentId } });
    if (!doc) {
      throw new UnrecoverableError('Document missing');
    }
    if (doc.status === DocumentStatus.DONE) {
      return;
    }
    if (doc.status === DocumentStatus.FAILED) {
      return;
    }

    if (doc.status === DocumentStatus.QUEUED) {
      await this.documentsService.applyTransition(
        documentId,
        DocumentStatus.PROCESSING,
      );
      doc = await this.docRepo.findOne({ where: { id: documentId } });
      if (!doc) {
        throw new UnrecoverableError('Document missing');
      }
    }

    const content = doc.content?.trim() ?? '';
    if (!content) {
      await this.documentsService.applyTransition(
        documentId,
        DocumentStatus.FAILED,
        { result: null, processorDisplayName: null },
      );
      throw new UnrecoverableError('Empty content');
    }

    await new Promise((r) => setTimeout(r, randomSleepMs()));

    const user = await this.userRepo.findOne({ where: { id: doc.userId } });
    if (!user) {
      throw new Error('User not found during processing');
    }

    const displayName = user.displayName.trim();
    const processedAt = new Date().toISOString();
    const result = `Analysis of '${doc.title}' — processed for ${displayName} on ${processedAt}`;

    await this.documentsService.applyTransition(documentId, DocumentStatus.DONE, {
      result,
      processorDisplayName: displayName,
    });
  }
}
