import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { Document } from './entities/document.entity';
import { DocumentStatus } from './entities/document-status.enum';
import { DocumentType } from './entities/document-type.enum';
import { User } from './entities/user.entity';

const PASSWORD = 'Password123!';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ds = app.get(DataSource);
  const userRepo = ds.getRepository(User);
  const docRepo = ds.getRepository(Document);

  const hash = await bcrypt.hash(PASSWORD, 12);

  const seeds = [
    {
      email: 'alice@example.com',
      displayName: 'Alice One',
      docs: [
        {
          title: 'Q1 Invoice',
          content: 'Invoice body text',
          type: DocumentType.INVOICE,
          status: DocumentStatus.DONE,
          result: "Analysis of 'Q1 Invoice' — processed for Alice One",
          processorDisplayName: 'Alice One',
        },
        {
          title: 'Annual report',
          content: 'Report draft',
          type: DocumentType.REPORT,
          status: DocumentStatus.QUEUED,
          result: null,
          processorDisplayName: null,
        },
      ],
    },
    {
      email: 'bob@example.com',
      displayName: 'Bob Two',
      docs: [
        {
          title: 'NDA draft',
          content: 'Contract text',
          type: DocumentType.CONTRACT,
          status: DocumentStatus.PROCESSING,
          result: null,
          processorDisplayName: null,
        },
      ],
    },
    {
      email: 'carol@example.com',
      displayName: 'Carol Three',
      docs: [
        {
          title: 'Empty fail doc',
          content: '   ',
          type: DocumentType.REPORT,
          status: DocumentStatus.FAILED,
          result: null,
          processorDisplayName: null,
        },
      ],
    },
  ];

  for (const s of seeds) {
    let user = await userRepo.findOne({ where: { email: s.email } });
    if (!user) {
      user = userRepo.create({
        email: s.email,
        passwordHash: hash,
        displayName: s.displayName,
      });
      user = await userRepo.save(user);
      console.log(`Created user ${s.email}`);
    } else {
      console.log(`User exists ${s.email}, skipping user create`);
    }

    for (const d of s.docs) {
      const existing = await docRepo.findOne({
        where: { userId: user.id, title: d.title },
      });
      if (existing) {
        console.log(`  Document exists: ${d.title}`);
        continue;
      }
      const doc = docRepo.create({
        userId: user.id,
        title: d.title,
        content: d.content,
        type: d.type,
        status: d.status,
        result: d.result,
        processorDisplayName: d.processorDisplayName,
      });
      await docRepo.save(doc);
      console.log(`  Seeded document: ${d.title} (${d.status})`);
    }
  }

  await app.close();

  console.log('');
  console.log(
    'Seed done. Log in at the frontend (e.g. http://localhost:3000/login):',
  );
  console.log(`  Password (same for all): ${PASSWORD}`);
  for (const s of seeds) {
    console.log(`  Email: ${s.email}`);
  }
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
