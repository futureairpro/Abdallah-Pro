// ⏰ Serverless Cron Dispatcher for Abdullah's Journey OS (Fajr/Adhkar/Spaced Quizzes)
import { bot } from '../lib/bot.js';
import { registerHandlers } from '../lib/handlers.js';
import { runSchedulerCycle } from '../lib/scheduler.js';

let isRegistered = false;
if (bot && !isRegistered) {
  registerHandlers(bot);
  isRegistered = true;
}

export default async function handler(req, res) {
  try {
    const targetChatId = process.env.TELEGRAM_CHAT_ID || '1191760477';
    if (bot) {
      await runSchedulerCycle(bot, targetChatId);
    }
    return res.status(200).json({ 
      ok: true, 
      message: 'تم تشغيل دورة التذكيرات والمراجعة بنجاح', 
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    console.error('[Cron Dispatch Error]:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
