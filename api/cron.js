// ⏰ Serverless Cron Dispatcher - Broadcasts to ALL Registered Active Users
import { bot } from '../lib/bot.js';
import { runSchedulerCycle } from '../lib/scheduler.js';
import { getAllRegisteredUsers } from '../lib/supabase.js';

export default async function handler(req, res) {
  try {
    const users = await getAllRegisteredUsers();
    const activeUsers = users.filter(u => u.is_active !== false);

    console.log(`[Cron Dispatcher]: Running cycle for ${activeUsers.length} active users`);

    for (const u of activeUsers) {
      if (bot && u.telegram_id) {
        try {
          await runSchedulerCycle(bot, u.telegram_id, u.full_name);
        } catch (uErr) {
          console.warn(`[Cron User ${u.telegram_id} (${u.full_name}) Error]:`, uErr.message);
        }
      }
    }

    return res.status(200).json({ 
      ok: true, 
      message: `تم تشغيل دورة التذكيرات والمراجعة التلقائية لعدد (${activeUsers.length}) مستخدم بنجاح`, 
      users_count: activeUsers.length,
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    console.error('[Cron Dispatch Error]:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
