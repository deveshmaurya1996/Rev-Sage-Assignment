import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { DocumentStatus } from './document-status.enum';
import { DocumentType } from './document-type.enum';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, (u) => u.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 500 })
  title: string;

  @Column('text')
  content: string;

  @Column({ type: 'varchar', length: 32 })
  type: DocumentType;

  @Column({ type: 'varchar', length: 32 })
  status: DocumentStatus;

  @Column({ type: 'text', nullable: true })
  result: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  processorDisplayName: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
