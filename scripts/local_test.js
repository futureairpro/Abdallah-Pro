// 🧪 Local Development Polling Runner for Abdullah's Journey Bot
import { bot } from '../lib/bot.js';
import { registerHandlers } from '../lib/handlers.js';
import { startScheduler } from '../lib/scheduler.js';
import dotenv from 'dotenv';

dotenv.config();

if (!bot) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN is missing in .env');
  process.exit(1);
}

registerHandlers(bot);

const authUser = process.env.AUTHORIZED_USERS?.split(',')[0]?.trim() || '1191760477';
startScheduler(bot, authUser);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('👑 منظومة رحلة عبدالله (Abdullah\'s Journey OS) 🚀');
console.log('🩺 الفرقة الرابعة | الفصل الدراسي السابع (450 درجة)');
console.log('🧠 محرك الذكاء الاصطناعي متعدد المفاتيح (Gemini Multi-Key)');
console.log('⏰ المجدول التلقائي والمراجعة الذكية نشطة الآن');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

bot.telegram.deleteWebhook().then(() => {
  console.log('⚡ Webhook cleared. Starting Polling mode...');
  return bot.launch();
}).then(() => {
  console.log('🟢 البوت يعمل الآن بنجاح محلياً!');
  console.log('👉 افتح تليجرام وأرسل فويس للبوت: @abdallahprobot');
}).catch((err) => {
  console.error('❌ Failed to launch bot:', err);
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
