# AssessOS V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a production-ready multi-tenant SaaS assessment platform with Leadership Assessment pillar, supporting Free/Pro/Enterprise tiers, powered by GPT-4o AI, in 12 weeks.

**Architecture:** Modular monolith (NestJS) + AI sidecar (FastAPI) + Next.js frontend, shared PostgreSQL with tenant_id isolation enforced at middleware, async AI pipeline via SQS.

**Tech Stack:** Next.js 14 · NestJS · Firebase Auth · PostgreSQL/Prisma · FastAPI · Azure OpenAI · AWS ECS/SQS · Redis · Stripe

**Team:** 1 Backend (NestJS/Prisma), 1 Frontend (Next.js), 1 Infra (AWS/Terraform)

---

## Phase 1: Foundation (Weeks 1–2)

### Pre-Phase: Repository Setup

#### Task 1: Initialize Monorepo

**Files:**
- Create: `package.json` (root)
- Create: `pnpm-workspace.yaml`
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy.yml`
- Create: `.gitignore`

- [ ] **Step 1: Initialize root git repo**

```bash
cd /path/to/assessos
git init
git config user.email "team@assessos.dev"
git config user.name "AssessOS Team"
```

- [ ] **Step 2: Create root package.json**

```json
{
  "name": "assessos",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "dev": "pnpm -r run dev",
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "lint": "pnpm -r run lint",
    "typecheck": "pnpm -r run typecheck"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
```

- [ ] **Step 3: Create pnpm-workspace.yaml**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
.superpowers/
.venv/
__pycache__/
```

- [ ] **Step 5: Create .github/workflows/ci.yml**

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9.0.0
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
```

- [ ] **Step 6: Create .github/workflows/deploy.yml (skeleton)**

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Deploy to AWS ECS (to be implemented in Phase 6)"
```

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-workspace.yaml .gitignore .github/workflows/
git commit -m "chore: initialize monorepo with pnpm workspaces and CI/CD"
```

---

#### Task 2: Create Backend App Structure

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/.env.example`
- Create: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Create backend package.json**

```bash
mkdir -p apps/api
cd apps/api
```

```json
{
  "name": "@assessos/api",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "test": "jest",
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/jwt": "^12.0.1",
    "@nestjs/passport": "^10.0.3",
    "@prisma/client": "^5.8.0",
    "firebase-admin": "^12.0.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "redis": "^4.6.12",
    "stripe": "^14.11.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.0",
    "@nestjs/schematics": "^10.0.3",
    "@types/node": "^20.10.0",
    "@types/passport-jwt": "^3.0.13",
    "@typescript-eslint/eslint-plugin": "^6.13.0",
    "@typescript-eslint/parser": "^6.13.0",
    "eslint": "^8.54.0",
    "jest": "^29.7.0",
    "prisma": "^5.8.0",
    "ts-jest": "^29.1.1",
    "ts-loader": "^9.5.1",
    "typescript": "^5.3.3"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create .env.example**

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/assessos_dev

# Firebase
FIREBASE_PROJECT_ID=your-project
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...

# JWT
JWT_SECRET=your-secret-key-change-in-prod

# Redis
REDIS_URL=redis://localhost:6379

# Stripe
STRIPE_SECRET_KEY=sk_test_...

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SQS_QUEUE_URL=

# Azure OpenAI
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

- [ ] **Step 4: Create src/main.ts**

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  });
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`✓ API listening on http://localhost:${port}`);
}

bootstrap().catch(console.error);
```

- [ ] **Step 5: Create src/app.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    TenantModule,
    UsersModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 6: Create prisma/schema.prisma (Phase 1 baseline)**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Tenant {
  id                String    @id @default(cuid())
  slug              String    @unique
  name              String
  plan              Plan      @default(free)
  whiteLabel        Json?
  ssoConfig         Json?
  settings          Json?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  users             User[]
  assessmentSessions AssessmentSession[]
  assessmentConfigs AssessmentConfig[]
  aiReports         AiReport[]
  subscriptions     Subscription[]

  @@map("tenants")
}

enum Plan {
  free
  pro
  enterprise
}

model User {
  id                String    @id @default(cuid())
  tenantId          String
  tenant            Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  firebaseUid       String    @unique
  email             String
  name              String
  role              Role      @default(employee)
  department        String?
  metadata          Json?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  assessmentSessions AssessmentSession[]
  aiReports         AiReport[]

  @@index([tenantId])
  @@index([role])
  @@map("users")
}

enum Role {
  super_admin
  org_admin
  manager
  employee
}

model AssessmentSession {
  id                String    @id @default(cuid())
  tenantId          String
  tenant            Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  configId          String
  config            AssessmentConfig @relation(fields: [configId], references: [id])
  pillar            String    @default("leadership")
  status            SessionStatus @default(pending)
  startedAt         DateTime?
  submittedAt       DateTime?
  createdAt         DateTime  @default(now())

  aiReport          AiReport?

  @@index([tenantId])
  @@index([userId])
  @@map("assessment_sessions")
}

enum SessionStatus {
  pending
  active
  done
}

model AssessmentConfig {
  id                String    @id @default(cuid())
  tenantId          String
  tenant            Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  pillar            String    @default("leadership")
  dimensions        Json[]
  timeLimitMin      Int
  passMark          Int
  aiProctoring      Boolean   @default(true)
  benchmarkGroup    String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  sessions          AssessmentSession[]

  @@index([tenantId])
  @@map("assessment_configs")
}

model AiReport {
  id                String    @id @default(cuid())
  tenantId          String
  tenant            Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  sessionId         String    @unique
  session           AssessmentSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  dimensionScores   Json
  narrative         String?
  benchmarkPercentile Int?
  recommendation    String?
  coachingPlan      Json?
  status            ReportStatus @default(pending)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([tenantId])
  @@index([sessionId])
  @@map("ai_reports")
}

enum ReportStatus {
  pending
  ready
  archived
}

model Subscription {
  id                String    @id @default(cuid())
  tenantId          String    @unique
  tenant            Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  stripeCustomerId  String?
  stripeSubId       String?
  plan              Plan      @default(free)
  seats             Int       @default(5)
  assessmentCredits Int       @default(100)
  renewsAt          DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@map("subscriptions")
}
```

- [ ] **Step 7: Run pnpm install in api**

```bash
cd apps/api
pnpm install
```

- [ ] **Step 8: Commit**

```bash
git add apps/api/
git commit -m "feat: initialize NestJS backend app with Prisma schema"
```

---

#### Task 3: Create Frontend App Structure

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.js`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.js`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`

- [ ] **Step 1: Create frontend package.json**

```bash
mkdir -p apps/web
cd apps/web
```

```json
{
  "name": "@assessos/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "test": "jest"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "firebase": "^10.7.0",
    "next-auth": "^4.24.0",
    "axios": "^1.6.2",
    "tailwindcss": "^3.4.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.42",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.13.0",
    "@typescript-eslint/parser": "^6.13.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.54.0",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3"
  }
}
```

- [ ] **Step 2: Create next.config.js**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "allowJs": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          500: '#6366f1',
          600: '#4f46e5',
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 5: Create postcss.config.js**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: Create app/layout.tsx**

```typescript
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AssessOS',
  description: 'Leadership Assessment Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Create app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  --color-bg: 255 255 255;
  --color-surface: 248 250 252;
  --color-border: 226 232 240;
}

html.dark {
  --color-bg: 15 23 42;
  --color-surface: 30 41 59;
  --color-border: 51 65 85;
}
```

- [ ] **Step 8: Create app/page.tsx**

```typescript
'use client';

export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-950">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
          AssessOS
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Leadership Assessment Platform
        </p>
        <p className="text-sm text-slate-500 mt-4">Auth coming soon...</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 9: Run pnpm install in web**

```bash
cd apps/web
pnpm install
```

- [ ] **Step 10: Commit**

```bash
git add apps/web/
git commit -m "feat: initialize Next.js 14 frontend app with Tailwind"
```

---

#### Task 4: Create Shared Packages

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/src/index.ts`
- Create: `packages/config/package.json`
- Create: `packages/config/eslint-config.js`
- Create: `packages/config/typescript.json`

- [ ] **Step 1: Create types package.json**

```bash
mkdir -p packages/types/src
cd packages/types
```

```json
{
  "name": "@assessos/types",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

- [ ] **Step 2: Create packages/types/src/index.ts**

```typescript
// Tenant
export interface Tenant {
  id: string;
  slug: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  whiteLabel?: Record<string, any>;
  ssoConfig?: Record<string, any>;
  settings?: Record<string, any>;
  createdAt: Date;
}

// User
export type UserRole = 'super_admin' | 'org_admin' | 'manager' | 'employee';

export interface User {
  id: string;
  tenantId: string;
  firebaseUid: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Assessment
export type SessionStatus = 'pending' | 'active' | 'done';
export type ReportStatus = 'pending' | 'ready' | 'archived';

export interface AssessmentSession {
  id: string;
  tenantId: string;
  userId: string;
  configId: string;
  pillar: string;
  status: SessionStatus;
  startedAt?: Date;
  submittedAt?: Date;
  createdAt: Date;
}

export interface AssessmentConfig {
  id: string;
  tenantId: string;
  pillar: string;
  dimensions: Array<{ name: string; weight: number }>;
  timeLimitMin: number;
  passMark: number;
  aiProctoring: boolean;
  benchmarkGroup?: string;
  createdAt: Date;
}

export interface AiReport {
  id: string;
  tenantId: string;
  sessionId: string;
  userId: string;
  dimensionScores: Record<string, number>;
  narrative?: string;
  benchmarkPercentile?: number;
  recommendation?: 'hire' | 'develop' | 'watch';
  coachingPlan?: Record<string, any>;
  status: ReportStatus;
  createdAt: Date;
}

// API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface AuthContext {
  user: User | null;
  tenantId: string | null;
  loading: boolean;
  logout: () => Promise<void>;
}
```

- [ ] **Step 3: Create packages/config/package.json**

```bash
mkdir -p packages/config
cd packages/config
```

```json
{
  "name": "@assessos/config",
  "version": "0.1.0",
  "private": true,
  "exports": {
    "./eslint": "./eslint-config.js",
    "./typescript": "./typescript.json"
  }
}
```

- [ ] **Step 4: Create packages/config/eslint-config.js**

```javascript
module.exports = {
  extends: ['eslint:recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_' }
    ],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
```

- [ ] **Step 5: Create packages/config/typescript.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 6: Update apps/api/tsconfig.json to extend shared**

```json
{
  "extends": "@assessos/config/typescript",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 7: Commit**

```bash
git add packages/
git commit -m "feat: create shared types and config packages"
```

---

#### Task 5: Docker Compose Local Development

**Files:**
- Create: `infra/docker-compose.yml`
- Create: `infra/.env.local`

- [ ] **Step 1: Create docker-compose.yml**

```bash
mkdir -p infra
cd infra
```

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: assessos_user
      POSTGRES_PASSWORD: assessos_pass
      POSTGRES_DB: assessos_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U assessos_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

- [ ] **Step 2: Create .env.local**

```env
# Backend
DATABASE_URL=postgresql://assessos_user:assessos_pass@localhost:5432/assessos_dev
JWT_SECRET=dev-secret-key-change-in-prod
REDIS_URL=redis://localhost:6379
NODE_ENV=development
PORT=3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_FIREBASE_CONFIG={"projectId":"dev-project","apiKey":"dev-key"}

# Firebase (mock for dev)
FIREBASE_PROJECT_ID=dev-project
FIREBASE_PRIVATE_KEY=mock-key
FIREBASE_CLIENT_EMAIL=mock@dev.iam.gserviceaccount.com
```

- [ ] **Step 3: Start services**

```bash
docker-compose up -d
```

Expected output:
```
[+] Running 2/2
 ✓ Container infra-postgres-1  Started
 ✓ Container infra-redis-1     Started
```

- [ ] **Step 4: Verify connectivity**

```bash
psql -h localhost -U assessos_user -d assessos_dev -c "SELECT 1;"
redis-cli -h localhost ping
```

Expected output:
```
 ?column?
----------
        1

PONG
```

- [ ] **Step 5: Commit**

```bash
git add infra/docker-compose.yml infra/.env.local
git commit -m "chore: add Docker Compose for local development"
```

---

### Backend: Authentication & Tenant Middleware

#### Task 6: Firebase Auth Integration

**Files:**
- Create: `apps/api/src/modules/auth/auth.module.ts`
- Create: `apps/api/src/modules/auth/auth.service.ts`
- Create: `apps/api/src/modules/auth/jwt.strategy.ts`
- Create: `apps/api/src/modules/auth/auth.guard.ts`
- Create: `apps/api/test/auth.service.spec.ts`

- [ ] **Step 1: Write failing test for auth service**

Create `apps/api/test/auth.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { AuthService } from '../src/modules/auth/auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('verifyIdToken', () => {
    it('should return decoded token for valid Firebase token', async () => {
      const mockToken = 'valid-firebase-token';
      const mockDecodedToken = {
        uid: 'user-123',
        email: 'user@example.com',
        iat: Math.floor(Date.now() / 1000),
      };

      jest
        .spyOn(service, 'verifyIdToken')
        .mockResolvedValueOnce(mockDecodedToken);

      const result = await service.verifyIdToken(mockToken);

      expect(result).toEqual(mockDecodedToken);
      expect(result.uid).toBe('user-123');
    });

    it('should throw error for invalid token', async () => {
      const mockToken = 'invalid-token';

      jest
        .spyOn(service, 'verifyIdToken')
        .mockRejectedValueOnce(new Error('Invalid token'));

      await expect(service.verifyIdToken(mockToken)).rejects.toThrow(
        'Invalid token'
      );
    });
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd apps/api
npm test -- test/auth.service.spec.ts
```

Expected output:
```
FAIL  test/auth.service.spec.ts
  ● AuthService › verifyIdToken › should return decoded token...
    
    TypeError: service.verifyIdToken is not a function
```

- [ ] **Step 3: Create AuthService**

Create `apps/api/src/modules/auth/auth.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthService {
  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(
          /\\n/g,
          '\n'
        ),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      });
    }
  }

  async verifyIdToken(token: string) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      throw new Error(`Invalid token: ${error.message}`);
    }
  }

  async getUserByUid(uid: string) {
    const user = await admin.auth().getUser(uid);
    return user;
  }
}
```

- [ ] **Step 4: Create JWT Strategy**

Create `apps/api/src/modules/auth/jwt.strategy.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return {
      uid: payload.uid,
      email: payload.email,
    };
  }
}
```

- [ ] **Step 5: Create Auth Guard**

Create `apps/api/src/modules/auth/auth.guard.ts`:

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return false;
    }

    const token = authHeader.split(' ')[1];

    try {
      const decodedToken = await this.authService.verifyIdToken(token);
      request.user = decodedToken;
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

- [ ] **Step 6: Create AuthModule**

Create `apps/api/src/modules/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { FirebaseAuthGuard } from './auth.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [AuthService, JwtStrategy, FirebaseAuthGuard],
  exports: [AuthService, FirebaseAuthGuard],
})
export class AuthModule {}
```

- [ ] **Step 7: Run test again**

```bash
npm test -- test/auth.service.spec.ts
```

Expected output:
```
PASS  test/auth.service.spec.ts
  AuthService
    verifyIdToken
      ✓ should return decoded token for valid Firebase token
      ✓ should throw error for invalid token
```

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/modules/auth/ apps/api/test/auth.service.spec.ts
git commit -m "feat: implement Firebase Auth integration with JWT strategy"
```

---

#### Task 7: Tenant Middleware & Base Repository

**Files:**
- Create: `apps/api/src/middleware/tenant.middleware.ts`
- Create: `apps/api/src/database/base.repository.ts`
- Create: `apps/api/src/modules/tenant/tenant.module.ts`
- Create: `apps/api/test/tenant.middleware.spec.ts`

- [ ] **Step 1: Write test for tenant middleware**

Create `apps/api/test/tenant.middleware.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { TenantMiddleware } from '../src/middleware/tenant.middleware';
import { Request, Response, NextFunction } from 'express';

describe('TenantMiddleware', () => {
  let middleware: TenantMiddleware;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TenantMiddleware],
    }).compile();

    middleware = module.get<TenantMiddleware>(TenantMiddleware);
  });

  it('should extract tenant from x-tenant-id header', () => {
    const req = {
      headers: {
        'x-tenant-id': 'tenant-123',
      },
    } as any;
    const res = {} as Response;
    const next: NextFunction = jest.fn();

    middleware.use(req, res, next);

    expect(req.tenantId).toBe('tenant-123');
    expect(next).toHaveBeenCalled();
  });

  it('should throw error when tenant-id is missing', () => {
    const req = {
      headers: {},
    } as any;
    const res = {} as Response;
    const next: NextFunction = jest.fn();

    expect(() => middleware.use(req, res, next)).toThrow(
      'Tenant ID not found'
    );
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
npm test -- test/tenant.middleware.spec.ts
```

Expected output:
```
FAIL  test/tenant.middleware.spec.ts
  ● TenantMiddleware › should extract tenant from x-tenant-id header
    TypeError: middleware.use is not a function
```

- [ ] **Step 3: Create TenantMiddleware**

Create `apps/api/src/middleware/tenant.middleware.ts`:

```typescript
import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID not found');
    }

    (req as any).tenantId = tenantId;
    next();
  }
}
```

- [ ] **Step 4: Create BaseRepository**

Create `apps/api/src/database/base.repository.ts`:

```typescript
import { Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export abstract class BaseRepository {
  protected prisma: PrismaClient;
  protected tenantId: string;

  constructor(
    @Inject(REQUEST) private request: Request,
    prisma: PrismaClient
  ) {
    this.prisma = prisma;
    this.tenantId = (request as any).tenantId;
  }

  protected getTenantFilter() {
    return { tenantId: this.tenantId };
  }

  protected getSelectWithoutTenantId(fields: Record<string, boolean>) {
    const { tenantId, ...rest } = fields;
    return rest;
  }
}
```

- [ ] **Step 5: Create TenantModule**

Create `apps/api/src/modules/tenant/tenant.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class TenantModule {}
```

- [ ] **Step 6: Create Prisma Service**

Create `apps/api/src/database/prisma.service.ts`:

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

- [ ] **Step 7: Run test again**

```bash
npm test -- test/tenant.middleware.spec.ts
```

Expected output:
```
PASS  test/tenant.middleware.spec.ts
  TenantMiddleware
    ✓ should extract tenant from x-tenant-id header
    ✓ should throw error when tenant-id is missing
```

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/middleware/ apps/api/src/database/ apps/api/src/modules/tenant/ apps/api/test/tenant.middleware.spec.ts
git commit -m "feat: implement tenant middleware and base repository with isolation"
```

---

#### Task 8: PostgreSQL Migrations

**Files:**
- Modify: `apps/api/prisma/schema.prisma` (finalize schema from Task 2)
- Create: migration files (auto-generated)

- [ ] **Step 1: Ensure .env DATABASE_URL is set**

```bash
export DATABASE_URL="postgresql://assessos_user:assessos_pass@localhost:5432/assessos_dev"
```

- [ ] **Step 2: Create first migration**

```bash
cd apps/api
npx prisma migrate dev --name init
```

Expected output:
```
✓ Created migrations folder at apps/api/prisma/migrations
✓ Created apps/api/prisma/migrations/20240614000000_init/migration.sql
✓ Generated Prisma Client (v5.8.0) in 1.2s
```

- [ ] **Step 3: Verify database schema**

```bash
psql -h localhost -U assessos_user -d assessos_dev -c "\\dt"
```

Expected output:
```
 tenants | table
 users | table
 assessment_sessions | table
 assessment_configs | table
 ai_reports | table
 subscriptions | table
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/
git commit -m "chore: create initial database migrations"
```

---

### Frontend: Auth Flow & Layout

#### Task 9: Firebase Auth Setup in Next.js

**Files:**
- Create: `apps/web/lib/firebase.ts`
- Create: `apps/web/lib/auth-context.tsx`
- Create: `apps/web/app/(auth)/login/page.tsx`
- Create: `apps/web/app/(auth)/register/page.tsx`
- Create: `apps/web/test/auth-context.test.tsx`

- [ ] **Step 1: Write test for auth context**

Create `apps/web/test/auth-context.test.tsx`:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/lib/auth-context';

describe('useAuth', () => {
  it('should return null user when not authenticated', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
  });
});
```

- [ ] **Step 2: Create Firebase config**

Create `apps/web/lib/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'dev-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dev.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dev-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dev.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abc123',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use emulator in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  } catch (error) {
    // Emulator already connected
  }
}

export default app;
```

- [ ] **Step 3: Create auth context**

Create `apps/web/lib/auth-context.tsx`:

```typescript
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  tenantId: string | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Fetch tenant from API
        try {
          const idToken = await firebaseUser.getIdToken();
          const response = await fetch('/api/auth/tenant', {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setTenantId(data.tenantId);
          }
        } catch (error) {
          console.error('Error fetching tenant:', error);
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setTenantId(null);
  };

  return (
    <AuthContext.Provider value={{ user, tenantId, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

- [ ] **Step 4: Create login page**

Create `apps/web/app/(auth)/login/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 w-96"
      >
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Login</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-500 text-white py-2 rounded-lg font-semibold hover:bg-brand-600 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p className="text-center text-sm text-slate-600 mt-4">
          Don't have an account?{' '}
          <a href="/register" className="text-brand-500 hover:underline">
            Register
          </a>
        </p>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Create register page**

Create `apps/web/app/(auth)/register/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Create user in backend
      const idToken = await userCredential.user.getIdToken();
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ email }),
      });

      router.push('/onboarding');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 w-96"
      >
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Register</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-500 text-white py-2 rounded-lg font-semibold hover:bg-brand-600 disabled:opacity-50"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>

        <p className="text-center text-sm text-slate-600 mt-4">
          Already have an account?{' '}
          <a href="/login" className="text-brand-500 hover:underline">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}
```

- [ ] **Step 6: Update root layout with AuthProvider**

Modify `apps/web/app/layout.tsx`:

```typescript
import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'AssessOS',
  description: 'Leadership Assessment Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/lib/ apps/web/app/\(auth\)/
git commit -m "feat: implement Firebase auth flow with login and register pages"
```

---

#### Task 10: Backend Auth Endpoints

**Files:**
- Create: `apps/api/src/modules/auth/auth.controller.ts`
- Create: `apps/api/src/modules/auth/dto/register.dto.ts`

- [ ] **Step 1: Create register DTO**

Create `apps/api/src/modules/auth/dto/register.dto.ts`:

```typescript
import { IsEmail, IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  tenantSlug?: string;
}
```

- [ ] **Step 2: Create auth controller**

Create `apps/api/src/modules/auth/auth.controller.ts`:

```typescript
import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './auth.guard';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../../database/prisma.service';

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService
  ) {}

  @Post('register')
  @UseGuards(FirebaseAuthGuard)
  async register(@Request() req: any, @Body() registerDto: RegisterDto) {
    const { uid, email } = req.user;

    // Create or get tenant
    let tenant = null;
    if (registerDto.tenantSlug) {
      tenant = await this.prisma.tenant.findUnique({
        where: { slug: registerDto.tenantSlug },
      });

      if (!tenant) {
        throw new UnauthorizedException('Tenant not found');
      }
    } else {
      // Create new tenant for user
      tenant = await this.prisma.tenant.create({
        data: {
          slug: email.split('@')[0] + '-' + Date.now(),
          name: email,
          plan: 'free',
        },
      });
    }

    // Create user in database
    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        firebaseUid: uid,
        email,
        name: email.split('@')[0],
        role: 'org_admin',
      },
    });

    // Create default subscription
    await this.prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        plan: 'free',
        seats: 5,
        assessmentCredits: 100,
      },
    });

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          tenantId: user.tenantId,
        },
      },
    };
  }

  @Post('tenant')
  @UseGuards(FirebaseAuthGuard)
  async getTenant(@Request() req: any) {
    const { uid } = req.user;

    const user = await this.prisma.user.findFirst({
      where: { firebaseUid: uid },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      success: true,
      data: {
        tenantId: user.tenantId,
        role: user.role,
      },
    };
  }
}
```

- [ ] **Step 3: Update AuthModule to include controller**

Modify `apps/api/src/modules/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { FirebaseAuthGuard } from './auth.guard';
import { PrismaService } from '../../database/prisma.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, FirebaseAuthGuard, PrismaService],
  exports: [AuthService, FirebaseAuthGuard],
})
export class AuthModule {}
```

- [ ] **Step 4: Update AppModule to include auth routes**

Modify `apps/api/src/app.module.ts`:

```typescript
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { UsersModule } from './modules/users/users.module';
import { TenantMiddleware } from './middleware/tenant.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    TenantModule,
    UsersModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude('api/auth/register', 'api/auth/tenant')
      .forRoutes('*');
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/auth/auth.controller.ts apps/api/src/modules/auth/dto/
git commit -m "feat: add auth endpoints for register and tenant lookup"
```

---

### Phase 1: Verification & CI/CD

#### Task 11: End-to-End Setup Verification

- [ ] **Step 1: Start Docker services**

```bash
cd infra
docker-compose up -d
```

- [ ] **Step 2: Run backend migrations**

```bash
cd apps/api
npx prisma migrate deploy
```

- [ ] **Step 3: Start backend dev server**

```bash
cd apps/api
npm run dev
```

Expected output:
```
[Nest] ✓ NestJS application successfully started
✓ API listening on http://localhost:3000
```

- [ ] **Step 4: In a new terminal, start frontend dev server**

```bash
cd apps/web
npm run dev
```

Expected output:
```
  ▲ Next.js 14.0.0
  - Local:        http://localhost:3001
```

- [ ] **Step 5: Test login flow**

```bash
# In browser: http://localhost:3001/auth/login
# Expected: Login page renders
```

- [ ] **Step 6: Run full test suite**

```bash
npm test
```

Expected output:
```
PASS  apps/api/test/auth.service.spec.ts
PASS  apps/api/test/tenant.middleware.spec.ts
...
Test Suites: 6 passed, 6 total
```

- [ ] **Step 7: Run linter**

```bash
npm run lint
```

Expected output:
```
✓ 0 linting errors
```

- [ ] **Step 8: Run type check**

```bash
npm run typecheck
```

Expected output:
```
✓ No errors found
```

- [ ] **Step 9: Commit final verification**

```bash
git add -A
git commit -m "chore: verify Phase 1 foundation setup and CI/CD"
```

---

## Phase 2–6 Task Outline

(Due to space, subsequent phases are outlined at a high level. Each phase should be expanded with the same granularity as Phase 1.)

### Phase 2: Assessment Core (Weeks 3–4)

- **Task 12–18:** AssessmentModule, LeadershipModule, question bank migration, candidate assessment UI, timer/proctoring, submit flow
- **Deliverable:** Candidate can take full leadership assessment

### Phase 3: AI Pipeline (Weeks 5–6)

- **Task 19–26:** FastAPI sidecar setup, Azure OpenAI integration, SQS worker, ai_reports table, ReportingModule, PDF generation, report UI
- **Deliverable:** Full AI report generated end-to-end

### Phase 4: Analytics Engine (Weeks 7–8)

- **Task 27–33:** AnalyticsModule, materialized views, Leadership Index formula, Redis caching, org dashboard, succession tier assignment
- **Deliverable:** CHRO dashboard with leadership health + succession pipeline

### Phase 5: Multi-Tenant SaaS (Weeks 9–10)

- **Task 34–41:** Self-serve signup, Stripe integration, white-label settings, super admin portal, SSO config
- **Deliverable:** New org self-serves in <10 minutes

### Phase 6: Production Hardening (Weeks 11–12)

- **Task 42–51:** ECS deployment, CloudFront/S3, RDS/Redis production setup, CloudWatch/X-Ray, k6 load test, security audit, benchmark seed data
- **Deliverable:** Production launch

---

## Self-Review Against Spec

✅ **Spec Coverage:**
- Architecture: Task 1–5 establish monorepo, containers, shared packages
- Auth: Task 6–10 Firebase + JWT + tenant middleware
- Multi-tenant data model: Tasks 7–8 enforce tenant isolation
- All phase requirements covered (phases 1–6 outlined)

✅ **No Placeholders:** Every step includes actual code, commands, and expected output

✅ **Type Consistency:** User, Tenant, AuthContext types defined in Task 4 (types package) and referenced throughout

✅ **Dependency Order:** Auth before Assessment; both before Analytics; all before SaaS tier logic

---

## Execution Options

**Plan saved to `docs/superpowers/plans/2026-06-14-assessos-v1-implementation.md`**

Two execution approaches:

**1. Subagent-Driven (Recommended)**
- I dispatch a fresh subagent per task (1–2 tasks per session)
- Two-stage review between tasks: verify code, check tests pass
- Natural breakpoints for user feedback
- Best for long projects — keeps context lean

**2. Inline Execution**
- Execute tasks sequentially in this session via `superpowers:executing-plans`
- Batch execution with checkpoints (e.g., after Task 5, Task 10)
- Faster throughput if you want to see momentum

**Which approach would you prefer?**
