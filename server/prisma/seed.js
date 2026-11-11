import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Production guard: refuses to run in production unless explicitly overridden
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
  console.error(
    'Seed refused: NODE_ENV is "production". Set ALLOW_DEMO_SEED=true to override for demo environments only.',
  );
  process.exit(1);
}

const BCRYPT_ROUNDS = 12;

const DEMO_PATIENT = {
  name: 'Demo Patient',
  email: 'demo@sweety.app',
  password: 'Demo@1234',
  role: 'PATIENT',
};

const DEMO_DOCTOR = {
  name: 'Dr. Sarah Smith',
  email: 'doctor@sweety.app',
  password: 'Doctor@1234',
  role: 'DOCTOR',
};

const SLOTS = ['MORNING_FASTING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER'];

/**
 * Generates a realistic blood glucose value and clinical note based on slot.
 * @param {string} slot
 * @param {number} dayIndex
 * @returns {{ value: number, notes: string | null }}
 */
function getRealisticGlucoseData(slot, dayIndex) {
  const variation = (dayIndex % 7) * 2;

  switch (slot) {
    case 'MORNING_FASTING':
      if (dayIndex % 20 === 0) return { value: 68, notes: 'Felt slight dizziness on waking' };
      if (dayIndex % 15 === 0) return { value: 142, notes: 'Late dinner previous night' };
      return { value: 92 + variation, notes: null };
    case 'AFTER_BREAKFAST':
      return { value: 125 + variation * 2, notes: null };
    case 'AFTER_LUNCH':
      if (dayIndex % 12 === 0) return { value: 185, notes: 'Celebration lunch with dessert' };
      return { value: 135 + variation * 2, notes: null };
    case 'AFTER_DINNER':
      return { value: 120 + variation * 2, notes: null };
    default:
      return { value: 110, notes: null };
  }
}

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Hash passwords
  const patientHash = await bcrypt.hash(DEMO_PATIENT.password, BCRYPT_ROUNDS);
  const doctorHash = await bcrypt.hash(DEMO_DOCTOR.password, BCRYPT_ROUNDS);

  // 2. Upsert Demo Patient
  const patient = await prisma.user.upsert({
    where: { email: DEMO_PATIENT.email },
    update: {
      name: DEMO_PATIENT.name,
      passwordHash: patientHash,
      role: DEMO_PATIENT.role,
    },
    create: {
      name: DEMO_PATIENT.name,
      email: DEMO_PATIENT.email,
      passwordHash: patientHash,
      role: DEMO_PATIENT.role,
    },
  });
  console.log(`✓ Patient ready: ${patient.email} (${patient.id})`);

  // 3. Upsert Demo Doctor
  const doctor = await prisma.user.upsert({
    where: { email: DEMO_DOCTOR.email },
    update: {
      name: DEMO_DOCTOR.name,
      passwordHash: doctorHash,
      role: DEMO_DOCTOR.role,
    },
    create: {
      name: DEMO_DOCTOR.name,
      email: DEMO_DOCTOR.email,
      passwordHash: doctorHash,
      role: DEMO_DOCTOR.role,
    },
  });
  console.log(`✓ Doctor ready: ${doctor.email} (${doctor.id})`);

  // 4. Link Doctor to Patient
  await prisma.doctorPatient.upsert({
    where: {
      doctorId_patientId: {
        doctorId: doctor.id,
        patientId: patient.id,
      },
    },
    update: {},
    create: {
      doctorId: doctor.id,
      patientId: patient.id,
    },
  });
  console.log(`✓ Linked Doctor ${doctor.email} -> Patient ${patient.email}`);

  // 5. Seed 60 Days of Readings for the Demo Patient
  await prisma.reading.deleteMany({
    where: { userId: patient.id },
  });

  const now = new Date();
  const readingsToInsert = [];

  // Loop back 60 days from today
  for (let i = 59; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    
    // For yesterday (i === 1), create only 2 readings so BullMQ daily reminder has an active test case!
    const slotsForDay = i === 1 ? [SLOTS[0], SLOTS[1]] : SLOTS;

    for (const slot of slotsForDay) {
      const { value, notes } = getRealisticGlucoseData(slot, i);
      readingsToInsert.push({
        userId: patient.id,
        readingDate: d,
        slot,
        value,
        notes,
      });
    }
  }

  // Insert in batches of 50
  for (let i = 0; i < readingsToInsert.length; i += 50) {
    const batch = readingsToInsert.slice(i, i + 50);
    await prisma.reading.createMany({
      data: batch,
    });
  }

  console.log(`✓ Seeded ${readingsToInsert.length} readings across the last 60 days for ${patient.email}`);
  
  // Clean ASCII credentials summary box for reviewers
  console.log(`
┌────────────────────────────────────────────────────────────┐
│           SWEETY DEMO SEED - CREDENTIALS SUMMARY           │
├────────────────────────────────────────────────────────────┤
│  Patient Account : demo@sweety.app   / Demo@1234           │
│  Doctor Account  : doctor@sweety.app / Doctor@1234           │
│  History Seeded  : 60 Days (${readingsToInsert.length} Total Readings)            │
│  Clinical Notes  : Realistic patient notes for lows/highs  │
│  Edge Case Day   : 1 Day with 2 readings for BullMQ test   │
└────────────────────────────────────────────────────────────┘
  `);
  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
