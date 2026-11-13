import { createReminderProcessor } from '../src/modules/reminders/reminder.processor.js';
import { prisma } from '../src/lib/prisma.js';

console.log('🔍 Sweety Reminder Worker: Checking today\'s meal slot readings for all patients...');
try {
  const processor = createReminderProcessor({ prisma });
  const result = await processor({ data: {} });
  console.log('✅ Daily reminder check completed:');
  console.log(`   - Reference Date: ${result.referenceDate}`);
  console.log(`   - Total Patients scanned: ${result.totalPatients}`);
  console.log(`   - Patients sent reminders (< 4 readings today): ${result.remindedCount}`);
  console.log(`   - Patients with complete 4/4 logs (skipped): ${result.skippedCount}`);
} catch (err) {
  console.error('❌ Reminder check failed:', err);
} finally {
  await prisma.$disconnect();
  process.exit(0);
}
