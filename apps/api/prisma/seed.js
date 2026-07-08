/* Idempotent demo seed. Run: `node prisma/seed.js` (or `prisma db seed`).
   Uses fixed ids + upserts so re-running is safe. */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // ── Tenant ────────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'tenant-001' },
    update: {},
    create: {
      id: 'tenant-001',
      slug: 'tenant-001',
      name: 'Acme Corporation',
      plan: 'enterprise',
      settings: { theme: 'assessos', locale: 'en' },
    },
  });

  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      plan: 'enterprise',
      seats: 250,
      assessmentCredits: 5000,
      renewsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    },
  });

  // ── Users ─────────────────────────────────────────────────────────────────
  const users = [
    { id: 'usr-admin', firebaseUid: 'seed-admin-uid', email: 'admin@assessos.test', name: 'Alex Admin', role: 'org_admin', department: 'People' },
    { id: 'usr-manager', firebaseUid: 'seed-manager-uid', email: 'manager@assessos.test', name: 'Morgan Lee', role: 'manager', department: 'People' },
    { id: 'usr-jane', firebaseUid: 'seed-jane-uid', email: 'jane.doe@acme.test', name: 'Jane Doe', role: 'employee', department: 'Engineering' },
    { id: 'usr-john', firebaseUid: 'seed-john-uid', email: 'john.smith@acme.test', name: 'John Smith', role: 'employee', department: 'Product' },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { firebaseUid: u.firebaseUid },
      update: {},
      create: { ...u, tenantId: tenant.id },
    });
  }

  // ── Assessment config ───────────────────────────────────────────────────────
  const config = await prisma.assessmentConfig.upsert({
    where: { id: 'cfg-leadership-001' },
    update: {},
    create: {
      id: 'cfg-leadership-001',
      tenantId: tenant.id,
      pillar: 'leadership',
      dimensions: [
        { id: 'vision', label: 'Vision & Strategy', weight: 0.2 },
        { id: 'execution', label: 'Execution', weight: 0.2 },
        { id: 'people', label: 'People Development', weight: 0.2 },
        { id: 'communication', label: 'Communication', weight: 0.2 },
        { id: 'integrity', label: 'Integrity', weight: 0.2 },
      ],
      timeLimitMin: 30,
      passMark: 60,
      aiProctoring: true,
      benchmarkGroup: 'global-leaders',
    },
  });

  // ── Sessions + AI reports ───────────────────────────────────────────────────
  const seeds = [
    {
      id: 'sess-jane-001', userId: 'usr-jane', percentile: 82,
      scores: { vision: 4.4, execution: 4.1, people: 3.9, communication: 4.5, integrity: 4.7 },
      narrative: 'Jane demonstrates strong leadership capabilities, especially in communication and integrity, with room to grow in people development.',
    },
    {
      id: 'sess-john-001', userId: 'usr-john', percentile: 67,
      scores: { vision: 3.6, execution: 3.9, people: 3.4, communication: 3.7, integrity: 4.0 },
      narrative: 'John shows solid execution and integrity; focusing on vision-setting and coaching others would raise his leadership index.',
    },
  ];
  for (const s of seeds) {
    await prisma.assessmentSession.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        tenantId: tenant.id,
        userId: s.userId,
        configId: config.id,
        pillar: 'leadership',
        status: 'done',
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 25),
      },
    });
    await prisma.aiReport.upsert({
      where: { sessionId: s.id },
      update: {},
      create: {
        tenantId: tenant.id,
        sessionId: s.id,
        userId: s.userId,
        dimensionScores: s.scores,
        narrative: s.narrative,
        benchmarkPercentile: s.percentile,
        recommendation: s.percentile >= 80 ? 'ready_now' : 'ready_2yr',
        coachingPlan: {
          goals: [
            { goal: 'Strengthen strategic planning', actions: ['Attend strategy workshop', 'Shadow a senior leader for one sprint'] },
            { goal: 'Develop direct reports', actions: ['Run weekly 1:1s', 'Set quarterly growth goals per report'] },
          ],
        },
        status: 'ready',
      },
    });
  }

  const counts = {
    tenants: await prisma.tenant.count(),
    users: await prisma.user.count(),
    configs: await prisma.assessmentConfig.count(),
    sessions: await prisma.assessmentSession.count(),
    reports: await prisma.aiReport.count(),
    subscriptions: await prisma.subscription.count(),
  };
  console.log('Seed complete:', JSON.stringify(counts));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
