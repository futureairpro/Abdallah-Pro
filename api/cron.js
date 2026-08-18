// ⏰ Serverless Cron Dispatcher for Abdullah's Journey OS (Adhkar, Prayers, Spaced Quizzes, Mindset Pulses)
import { bot } from '../lib/bot.js';
import { runSchedulerCycle } from '../lib/scheduler.js';

export default async function handler(req, res) {
  try {
    const targetChatId = process.env.TELEGRAM_CHAT_ID || process.env.AUTHORIZED_USERS?.split(',')[0]?.trim() || '1191760477';
    if (bot) {
      await runSchedulerCycle(bot, targetChatId);
    }
    return res.status(200).json({ 
      ok: true, 
      message: 'تم تشغيل دورة التذكيرات والمراجعة التلقائية بنجاح', 
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    console.error('[Cron Dispatch Error]:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
