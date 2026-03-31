# Refactoring challenge — `DocumentService`

The original snippet mixed concerns, skipped validation, leaked data across users, and had several runtime hazards. Below is a refactored version with typed DTOs, transactional tag handling, database-level filtering, enforced status transitions, and safe null handling. `Tag` is shown only as a minimal stub for the exercise (not wired into the main app).

## Refactored code

```typescript
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './document.entity';
import { User } from './user.entity';
import { Tag } from './tag.entity';
import { CreateDocumentDto } from './dto/create-document.dto';

const STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  QUEUED: ['PROCESSING', 'FAILED'],
  PROCESSING: ['DONE', 'FAILED'],
  DONE: [],
  FAILED: [],
};

function assertTransition(from: string, to: string): void {
  const allowed = STATUS_TRANSITIONS[from];
  if (!allowed?.includes(to)) {
    throw new BadRequestException(`Invalid transition ${from} → ${to}`);
  }
}

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private readonly docRepo: Repository<Document>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Tag)
    private readonly tagRepo: Repository<Tag>,
  ) {}

  async createDocument(
    userId: string,
    data: CreateDocumentDto,
  ): Promise<Document> {
    const doc = this.docRepo.create({
      title: data.title.trim(),
      content: data.content,
      type: data.type,
      status: 'QUEUED',
      userId,
      tags: [],
    });

    return this.docRepo.manager.transaction(async (manager) => {
      const saved = await manager.save(Document, doc);

      if (data.tags?.length) {
        const tags: Tag[] = [];
        for (const name of data.tags) {
          let tag = await manager.findOne(Tag, { where: { name } });
          if (!tag) {
            tag = manager.create(Tag, { name });
            tag = await manager.save(Tag, tag);
          }
          tags.push(tag);
        }
        saved.tags = tags;
        await manager.save(Document, saved);
      }

      return manager.findOneOrFail(Document, {
        where: { id: saved.id },
        relations: ['tags'],
      });
    });
  }

  async getDocumentsByUser(
    userId: string,
    status?: string,
  ): Promise<Document[]> {
    const qb = this.docRepo
      .createQueryBuilder('doc')
      .leftJoinAndSelect('doc.tags', 'tags')
      .where('doc.userId = :userId', { userId });

    if (status) {
      qb.andWhere('doc.status = :status', { status });
    }

    return qb.getMany();
  }

  async updateStatus(docId: string, newStatus: string): Promise<Document> {
    const doc = await this.docRepo.findOne({ where: { id: docId } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    assertTransition(doc.status, newStatus);
    doc.status = newStatus;
    return this.docRepo.save(doc);
  }

  async addResult(docId: string, result: string): Promise<Document> {
    const doc = await this.docRepo.findOne({ where: { id: docId } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    assertTransition(doc.status, 'DONE');
    doc.result = result;
    doc.status = 'DONE';
    return this.docRepo.save(doc);
  }

  async deleteDocument(
    docId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const doc = await this.docRepo.findOne({ where: { id: docId } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    if (doc.userId !== userId) {
      throw new ForbiddenException();
    }
    await this.docRepo.delete(docId);
    return { message: 'Deleted' };
  }
}
```

## Explanation of changes

1. **Replace `data: any` with `CreateDocumentDto`** — Enables compile-time safety and pairs with `class-validator` at the controller boundary (not shown here) so invalid payloads never reach the service.

2. **Pass `userId` explicitly into `createDocument`** — The original read `data.userId`, which is trivially spoofable from a client payload. Ownership must come from the authenticated request context.

3. **Initialize `tags` and use a transaction** — The original loop did `saved.tags.push(tag)` when `tags` was undefined, which throws. Wrapping creation and tag linking in `transaction()` keeps the document and tag rows consistent if any step fails.

4. **Resolve or create tags inside the transaction** — `findOne` + optional `save` avoids orphaned tag lookups and races compared to mutating `saved.tags` with possibly undefined `tag` results.

5. **Return the document with relations after save** — The original returned `saved` before assigning tags, so the response never included tags. The refactored code reloads with `relations: ['tags']` after the transactional updates.

6. **Filter in the database, not in memory** — `find({ relations })` pulled **all** documents for **all** users, then filtered in JS — a serious privacy bug and performance problem. `createQueryBuilder` scopes by `userId` first and optionally filters `status` in SQL.

7. **Guard `updateStatus`, `addResult`, and delete paths** — `findOne` can return `undefined`; assigning `doc.status` without checking crashes. Each method now throws `NotFoundException` when missing.

8. **Enforce valid status transitions** — `assertTransition` prevents jumping from `DONE` back to `QUEUED` or other invalid moves instead of blindly assigning strings.

9. **Align `addResult` with transitions** — Setting `status` to `DONE` only after validating the transition from the current state avoids illegal states.

10. **Authorize deletes** — `delete(docId)` ignored `userId`. The refactored code verifies ownership before deleting.

11. **Trim title** — Reduces accidental duplicate titles and matches typical validation expectations.

12. **Optional chaining on `data.tags`** — If tags are omitted, the method skips the tag block instead of iterating `undefined`.

This version is still not production-complete (e.g., pagination, optimistic locking for concurrent updates, and structured logging would be natural next steps), but it addresses the concrete bugs and bad practices in the original snippet.
