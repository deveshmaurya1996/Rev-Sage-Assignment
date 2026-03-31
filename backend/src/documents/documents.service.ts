import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MoreThan, Repository } from 'typeorm';
import { Document } from '../entities/document.entity';
import { DocumentStatus } from '../entities/document-status.enum';
import { User } from '../entities/user.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { ListDocumentsQueryDto } from './dto/list-documents-query.dto';
import { assertStatusTransition } from './document-status.transitions';
import { DocumentsGateway } from './documents.gateway';

export const DOCUMENT_QUEUE = 'document-process';

const PROCESS_JOB_ATTEMPTS = 3;

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly docRepo: Repository<Document>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectQueue(DOCUMENT_QUEUE)
    private readonly documentQueue: Queue,
    private readonly documentsGateway: DocumentsGateway,
  ) {}

  async create(userId: string, dto: CreateDocumentDto) {
    const title = dto.title.trim();
    const since = new Date(Date.now() - 60_000);
    const duplicate = await this.docRepo.findOne({
      where: {
        userId,
        title,
        type: dto.type,
        createdAt: MoreThan(since),
      },
    });
    if (duplicate) {
      throw new ConflictException(
        'A document with the same title and type was created within the last 60 seconds',
      );
    }

    const doc = this.docRepo.create({
      userId,
      title,
      content: dto.content,
      type: dto.type,
      status: DocumentStatus.QUEUED,
      result: null,
      processorDisplayName: null,
    });
    const saved = await this.docRepo.save(doc);

    await this.documentQueue.add(
      'process',
      { documentId: saved.id },
      {
        attempts: PROCESS_JOB_ATTEMPTS,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.documentsGateway.emitDocumentUpdate(userId, this.toPayload(saved));
    return saved;
  }

  async findAll(userId: string, query: ListDocumentsQueryDto) {
    const qb = this.docRepo
      .createQueryBuilder('d')
      .where('d.userId = :userId', { userId })
      .orderBy('d.createdAt', 'DESC');

    if (query.status) {
      qb.andWhere('d.status = :status', { status: query.status });
    }
    if (query.type) {
      qb.andWhere('d.type = :type', { type: query.type });
    }
    if (query.search?.trim()) {
      qb.andWhere('d.title ILIKE :search', {
        search: `%${query.search.trim()}%`,
      });
    }

    return qb.getMany();
  }

  async findOneForUser(id: string, userId: string) {
    const doc = await this.docRepo.findOne({ where: { id, userId } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    return doc;
  }

  async applyTransition(
    documentId: string,
    next: DocumentStatus,
    patch: Partial<Pick<Document, 'result' | 'processorDisplayName'>> = {},
  ): Promise<Document> {
    const doc = await this.docRepo.findOne({ where: { id: documentId } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    assertStatusTransition(doc.status, next);
    Object.assign(doc, patch, { status: next });
    const saved = await this.docRepo.save(doc);
    this.documentsGateway.emitDocumentUpdate(doc.userId, this.toPayload(saved));
    return saved;
  }

  private toPayload(doc: Document) {
    return {
      documentId: doc.id,
      status: doc.status,
      result: doc.result,
      processorDisplayName: doc.processorDisplayName,
      updatedAt: doc.updatedAt.toISOString(),
    };
  }
}
