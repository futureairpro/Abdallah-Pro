// ⏰ Serverless Cron Dispatcher - Broadcasts to ALL Registered Active Users
import { bot } from '../lib/bot.js';
import { runSchedulerCycle } from '../lib/scheduler.js';

export default async function handler(req, res) {
  try {
    if (!bot) {
      return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN is missing' });
    }

    console.log(`[Cron Dispatcher]: Running unified scheduler cycle...`);
    await runSchedulerCycle(bot);

    return res.status(200).json({ 
      ok: true, 
      message: `تم تشغيل دورة التذكيرات والمراجعة التلقائية بنجاح`, 
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    console.error('[Cron Dispatch Error]:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
