import { PrismaClient, AssessmentModuleId } from '@prisma/client';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Question } from '../src/models/mongo/Question';
import dotenv from 'dotenv';

import { technicalQuestions }    from './questions/technical';
import { attitudeQuestions }     from './questions/attitude';
import { behavioralQuestions }   from './questions/behavioral';
import { psychometricQuestions } from './questions/psychometric';
import { communicationQuestions } from './questions/communication';
import { buildQuestionBank }     from './questionBank';

dotenv.config();

const prisma = new PrismaClient();

async function seed(): Promise<void> {
  console.log('🌱 Seeding database...');

  // ─── Users ───────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash('demo1234', 12);
  await prisma.user.upsert({
    where:  { email: 'admin@leaderassess.com' },
    update: {},
    create: { email: 'admin@leaderassess.com', name: 'Sarah Admin', passwordHash: hash, role: 'admin', emailVerified: true },
  });
  await prisma.user.upsert({
    where:  { email: 'candidate@leaderassess.com' },
    update: {},
    create: { email: 'candidate@leaderassess.com', name: 'Jane Doe', passwordHash: hash, role: 'candidate', emailVerified: true },
  });
  await prisma.user.upsert({
    where:  { email: 'viewer@leaderassess.com' },
    update: {},
    create: { email: 'viewer@leaderassess.com', name: 'Raj Viewer', passwordHash: hash, role: 'viewer', emailVerified: true },
  });
  await prisma.user.upsert({
    where:  { email: 'recruiter@leaderassess.com' },
    update: {},
    create: { email: 'recruiter@leaderassess.com', name: 'Tom Recruiter', passwordHash: hash, role: 'recruiter', emailVerified: true },
  });
  console.log('✅  Users seeded');

  // ─── Assessment Configs ───────────────────────────────────────────────────
  const configs: Array<{
    moduleId: AssessmentModuleId; displayName: string; timeLimitMin: number;
    passMark: number; negativeMarking?: boolean; negativePenalty?: number;
    aiProctoring?: boolean; adaptiveMode?: boolean;
  }> = [
    { moduleId: 'technical',     displayName: 'Technical Assessment',     timeLimitMin: 120, passMark: 70, aiProctoring: true,  adaptiveMode: false },
    { moduleId: 'attitude',      displayName: 'Attitude Assessment',      timeLimitMin:  60, passMark: 65, aiProctoring: true,  adaptiveMode: false },
    { moduleId: 'behavioral',    displayName: 'Behavioral Assessment',    timeLimitMin:  90, passMark: 65, aiProctoring: true,  adaptiveMode: false },
    { moduleId: 'psychometric',  displayName: 'Psychometric Assessment',  timeLimitMin:  75, passMark: 70, aiProctoring: true,  adaptiveMode: true, negativeMarking: true, negativePenalty: 0.25 },
    { moduleId: 'communication', displayName: 'Communication Assessment', timeLimitMin:  60, passMark: 65, aiProctoring: false, adaptiveMode: false },
  ];

  for (const cfg of configs) {
    // moduleId is unique per organization; the default tenant has organizationId null,
    // so upsert manually via findFirst
    const existing = await prisma.assessmentConfig.findFirst({
      where: { moduleId: cfg.moduleId, organizationId: null },
    });
    if (existing) await prisma.assessmentConfig.update({ where: { id: existing.id }, data: cfg });
    else          await prisma.assessmentConfig.create({ data: cfg });
  }
  console.log('✅  Assessment configs seeded');

  // ─── Questions (MongoDB) ──────────────────────────────────────────────────
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/leaderassess';
  await mongoose.connect(mongoUri);

  // Hand-authored questions per module, topped up to 100 each from the
  // generated bank (parameterized, deterministic, all unique)
  const TARGET_PER_MODULE = 100;
  const authored = {
    technical:     technicalQuestions.map(q    => ({ ...q, moduleId: 'technical'     as const })),
    attitude:      attitudeQuestions.map(q     => ({ ...q, moduleId: 'attitude'      as const })),
    behavioral:    behavioralQuestions.map(q   => ({ ...q, moduleId: 'behavioral'    as const })),
    psychometric:  psychometricQuestions.map(q => ({ ...q, moduleId: 'psychometric'  as const })),
    communication: communicationQuestions.map(q => ({ ...q, moduleId: 'communication' as const })),
  };

  const bank = buildQuestionBank();
  const allQuestions: Array<Record<string, unknown>> = [];

  for (const moduleId of Object.keys(authored) as Array<keyof typeof authored>) {
    const own = authored[moduleId];
    const seen = new Set(own.map(q => q.text));
    const merged: Array<Record<string, unknown>> = own.map(q => ({ ...q }));
    for (const q of bank) {
      if (merged.length >= TARGET_PER_MODULE) break;
      if (q.moduleId !== moduleId || seen.has(q.text)) continue;
      seen.add(q.text);
      merged.push({ ...q });
    }
    allQuestions.push(...merged.map(q => ({ ...q, isActive: true })));
  }

  await Question.deleteMany({});
  await Question.insertMany(allQuestions);

  const counts = allQuestions.reduce<Record<string, number>>((acc, q) => {
    const m = q.moduleId as string;
    acc[m] = (acc[m] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`✅  ${allQuestions.length} questions seeded in MongoDB`);
  console.log(`    ${Object.entries(counts).map(([m, c]) => `${m}: ${c}`).join(' | ')}`);

  await mongoose.disconnect();
  await prisma.$disconnect();

  console.log('\n🎉 Seed complete!');
  console.log('\nDemo credentials:');
  console.log('  Admin:     admin@leaderassess.com     / demo1234');
  console.log('  Candidate: candidate@leaderassess.com / demo1234');
  console.log('  Viewer:    viewer@leaderassess.com    / demo1234');
  console.log('  Recruiter: recruiter@leaderassess.com / demo1234');
}

seed().catch(err => { console.error(err); process.exit(1); });
