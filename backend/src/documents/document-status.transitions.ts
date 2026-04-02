import { BadRequestException } from '@nestjs/common';
import { DocumentStatus } from '../entities/document-status.enum';

const ALLOWED: Record<DocumentStatus, DocumentStatus[]> = {
  [DocumentStatus.QUEUED]: [DocumentStatus.PROCESSING, DocumentStatus.FAILED],
  [DocumentStatus.PROCESSING]: [DocumentStatus.DONE, DocumentStatus.FAILED],
  [DocumentStatus.DONE]: [],
  [DocumentStatus.FAILED]: [],
};

export function assertStatusTransition(
  from: DocumentStatus,
  to: DocumentStatus,
): void {
  const next = ALLOWED[from] ?? [];
  if (!next.includes(to)) {
    throw new BadRequestException(
      `Invalid status transition from ${from} to ${to}`,
    );
  }
}
