import bcrypt from 'bcrypt';
import { Difficulty, ProblemType, Role } from '@prisma/client';
import { prisma } from '../src/app/shared/prisma';

async function main() {
  console.log('🌱 Starting database seed for DevAssess...');

  const saltRounds = 12;
  const adminPassword = await bcrypt.hash('Admin@1234', saltRounds);
  const recruiterPassword = await bcrypt.hash('Recruiter@1234', saltRounds);
  const candidatePassword = await bcrypt.hash('Candidate@1234', saltRounds);

  // 1. Upsert Demo Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@devassess.com' },
    update: {
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
    create: {
      email: 'admin@devassess.com',
      fullName: 'System Administrator',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      bio: 'Platform Overseer & Lead Auditor',
    },
  });
  console.log(`✅ Admin seeded: ${admin.email}`);

  // 2. Upsert Demo Recruiter & Company
  const recruiter = await prisma.user.upsert({
    where: { email: 'recruiter@techcorp.com' },
    update: {
      passwordHash: recruiterPassword,
      role: Role.RECRUITER,
    },
    create: {
      email: 'recruiter@techcorp.com',
      fullName: 'Tanvir Ahmed',
      passwordHash: recruiterPassword,
      role: Role.RECRUITER,
      bio: 'Head of Engineering Talent at TechCorp BD',
    },
  });

  const company = await prisma.company.upsert({
    where: { ownerId: recruiter.id },
    update: {
      name: 'TechCorp BD',
      slug: 'techcorp-bd',
      assessmentCredits: 25,
      planTier: 'PRO',
    },
    create: {
      ownerId: recruiter.id,
      name: 'TechCorp BD',
      slug: 'techcorp-bd',
      industry: 'Software & Technology',
      assessmentCredits: 25,
      planTier: 'PRO',
      website: 'https://techcorp.com.bd',
    },
  });
  console.log(`✅ Recruiter & Company seeded: ${recruiter.email} -> ${company.name} (Credits: ${company.assessmentCredits})`);

  // 3. Upsert Demo Candidate
  const candidate = await prisma.user.upsert({
    where: { email: 'candidate@devassess.com' },
    update: {
      passwordHash: candidatePassword,
      role: Role.CANDIDATE,
    },
    create: {
      email: 'candidate@devassess.com',
      fullName: 'Nusrat Jahan',
      passwordHash: candidatePassword,
      role: Role.CANDIDATE,
      bio: 'Full Stack Developer with Node.js & React experience',
    },
  });
  console.log(`✅ Candidate seeded: ${candidate.email}`);

  // 4. Seed Sample Problems under TechCorp BD
  // Problem 1: MCQ
  const existingMcq = await prisma.problem.findFirst({
    where: {
      companyId: company.id,
      title: 'JavaScript Event Loop & Microtasks',
    },
  });

  if (!existingMcq) {
    await prisma.problem.create({
      data: {
        companyId: company.id,
        title: 'JavaScript Event Loop & Microtasks',
        description: 'What is the execution order of Promise.then, setTimeout, and process.nextTick in the Node.js event loop?',
        type: ProblemType.MCQ,
        difficulty: Difficulty.EASY,
        tags: ['javascript', 'nodejs', 'event-loop'],
        options: [
          { id: 'A', text: 'setTimeout -> Promise.then -> process.nextTick', isCorrect: false },
          { id: 'B', text: 'process.nextTick -> Promise.then -> setTimeout', isCorrect: true },
          { id: 'C', text: 'Promise.then -> process.nextTick -> setTimeout', isCorrect: false },
          { id: 'D', text: 'setTimeout -> process.nextTick -> Promise.then', isCorrect: false },
        ],
        maxScore: 10,
      },
    });
    console.log('✅ Sample MCQ Problem seeded');
  }

  // Problem 2: Coding
  const existingCoding = await prisma.problem.findFirst({
    where: {
      companyId: company.id,
      title: 'Two Sum Target Indices',
    },
  });

  if (!existingCoding) {
    await prisma.problem.create({
      data: {
        companyId: company.id,
        title: 'Two Sum Target Indices',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        type: ProblemType.CODING,
        difficulty: Difficulty.MEDIUM,
        tags: ['algorithms', 'arrays', 'hash-table'],
        starterCode: {
          javascript: 'function twoSum(nums, target) {\n  // Write your solution here\n}',
          typescript: 'function twoSum(nums: number[], target: number): number[] {\n  // Write your solution here\n}',
        },
        testCases: [
          { input: '[2, 7, 11, 15], 9', expectedOutput: '[0, 1]', isHidden: false },
          { input: '[3, 2, 4], 6', expectedOutput: '[1, 2]', isHidden: false },
          { input: '[3, 3], 6', expectedOutput: '[0, 1]', isHidden: true },
        ],
        maxScore: 25,
      },
    });
    console.log('✅ Sample Coding Problem seeded');
  }

  // Problem 3: Written
  const existingWritten = await prisma.problem.findFirst({
    where: {
      companyId: company.id,
      title: 'System Architecture: Microservices vs Modular Monolith',
    },
  });

  if (!existingWritten) {
    await prisma.problem.create({
      data: {
        companyId: company.id,
        title: 'System Architecture: Microservices vs Modular Monolith',
        description: 'Explain the trade-offs between a modular monolith and a microservices architecture when building an early-stage SaaS platform.',
        type: ProblemType.WRITTEN,
        difficulty: Difficulty.HARD,
        tags: ['architecture', 'system-design', 'microservices'],
        maxScore: 15,
      },
    });
    console.log('✅ Sample Written Problem seeded');
  }

  console.log('✨ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
