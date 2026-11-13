/**
 * Seeds a local demo account so a fresh `docker compose up` has something to look at.
 * Idempotent: does nothing if the demo account already exists.
 */
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { loadConfig } from './config.js';
import { createDb } from './db/client.js';
import { tasks, users, type NewTaskRow } from './db/schema.js';

export const DEMO_EMAIL = 'demo@taskflow.local';
export const DEMO_PASSWORD = 'demo-password';

function daysFromToday(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const demoTasks: Omit<NewTaskRow, 'userId'>[] = [
  {
    title: 'Draft the onboarding checklist',
    description: 'Accounts, repo access, local setup and first-week goals.',
    status: 'in_progress',
    priority: 'high',
    dueDate: daysFromToday(2),
    tags: ['docs', 'team'],
  },
  {
    title: 'Fix flaky date picker test',
    description: 'Fails around midnight UTC. Pin the clock with fake timers.',
    status: 'todo',
    priority: 'urgent',
    dueDate: daysFromToday(-1),
    tags: ['bug', 'frontend'],
  },
  {
    title: 'Add index for due date queries',
    description: 'Check the query plan before and after.',
    status: 'done',
    priority: 'medium',
    dueDate: daysFromToday(-3),
    tags: ['backend', 'performance'],
  },
  {
    title: 'Review open pull requests',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: daysFromToday(0),
    tags: ['review'],
  },
  {
    title: 'Write release notes',
    description: 'Summarise user-facing changes since the last release.',
    status: 'todo',
    priority: 'low',
    dueDate: daysFromToday(6),
    tags: ['docs'],
  },
  {
    title: 'Upgrade Node.js base images',
    description: 'Rebuild containers and rerun the smoke test.',
    status: 'in_progress',
    priority: 'medium',
    dueDate: daysFromToday(4),
    tags: ['devops'],
  },
  {
    title: 'Plan next sprint',
    description: 'Groom the backlog and estimate the top items.',
    status: 'todo',
    priority: 'high',
    dueDate: daysFromToday(1),
    tags: ['team'],
  },
  {
    title: 'Book dentist appointment',
    description: '',
    status: 'todo',
    priority: 'low',
    dueDate: null,
    tags: ['personal'],
  },
  {
    title: 'Rotate API signing secret',
    description: 'Update the secret store and redeploy.',
    status: 'done',
    priority: 'high',
    dueDate: daysFromToday(-5),
    tags: ['security', 'devops'],
  },
  {
    title: 'Sketch dashboard empty states',
    description: 'What does a new user see before creating anything?',
    status: 'todo',
    priority: 'medium',
    dueDate: daysFromToday(9),
    tags: ['design', 'frontend'],
  },
  {
    title: 'Read up on Postgres partial indexes',
    description: '',
    status: 'todo',
    priority: 'low',
    dueDate: null,
    tags: ['learning', 'backend'],
  },
  {
    title: 'Clean up unused feature flags',
    description: 'Remove flags fully rolled out for more than a month.',
    status: 'todo',
    priority: 'medium',
    dueDate: daysFromToday(12),
    tags: ['backend', 'tech-debt'],
  },
];

const config = loadConfig();
const { db, pool } = createDb(config.DATABASE_URL);

try {
  const existing = await db.query.users.findFirst({ where: eq(users.email, DEMO_EMAIL) });
  if (existing) {
    console.log('Demo account already present, skipping seed');
  } else {
    await db.transaction(async (tx) => {
      const passwordHash = await bcrypt.hash(DEMO_PASSWORD, config.BCRYPT_ROUNDS);
      const [user] = await tx
        .insert(users)
        .values({ email: DEMO_EMAIL, name: 'Demo User', passwordHash })
        .returning();
      if (!user) throw new Error('Failed to create demo user');
      await tx.insert(tasks).values(demoTasks.map((task) => ({ ...task, userId: user.id })));
    });
    console.log(`Seeded demo account ${DEMO_EMAIL} with ${String(demoTasks.length)} tasks`);
  }
} finally {
  await pool.end();
}
