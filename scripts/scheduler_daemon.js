// ⏰ 24/7 Autonomous Background Scheduler Daemon for Abdullah's Journey OS
import { bot } from '../lib/bot.js';
import { runSchedulerCycle } from '../lib/scheduler.js';
import dotenv from 'dotenv';

dotenv.config();

const targetChatId = process.env.TELEGRAM_CHAT_ID || process.env.AUTHORIZED_USERS?.split(',')[0]?.trim() || '1191760477';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('⏰ مشغل التذكيرات والمراجعة التلقائية الذكي (24/7 Daemon) 🚀');
console.log(`👤 د. عبدالله (Chat ID: ${targetChatId})`);
console.log('⚡ فحص دوري مستمر كل 30 ثانية للمواعيد والصلوات والأذكار والكويزات');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (!bot) {
  console.error('❌ Error: Missing Telegram Bot instance. Check TELEGRAM_BOT_TOKEN.');
  process.exit(1);
}

let isRunningCycle = false;

async function executeCycle() {
  if (isRunningCycle) return;
  isRunningCycle = true;
  try {
    const cairoTime = new Date().toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour12: true });
    await runSchedulerCycle(bot, targetChatId);
    console.log(`[Daemon Heartbeat] ✅ ${cairoTime} - دورة التذكيرات والمواعيد تعمل بكفاءة.`);
  } catch (err) {
    console.error(`[Daemon Cycle Error]:`, err.message);
  } finally {
    isRunningCycle = false;
  }
}

// Initial immediate run
executeCycle();

// Repeat every 30 seconds
const INTERVAL_MS = 30000;
setInterval(executeCycle, INTERVAL_MS);

// Resilience against unexpected crashes
process.on('uncaughtException', (err) => {
  console.error('[Daemon Uncaught Exception]:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Daemon Unhandled Rejection]:', reason);
});
