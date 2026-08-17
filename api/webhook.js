// 🚀 Vercel Serverless Webhook Endpoint for Abdullah's Journey OS
import { bot } from '../lib/bot.js';
import { registerHandlers } from '../lib/handlers.js';

let isRegistered = false;
if (bot && !isRegistered) {
  registerHandlers(bot);
  isRegistered = true;
}

export default async function handler(req, res) {
  // 1. Handle Telegram Update POST
  if (req.method === 'POST') {
    try {
      if (!bot) {
        return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN is missing' });
      }

      if (req.body) {
        await bot.handleUpdate(req.body);
      }
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Error handling Telegram webhook update:', err);
      return res.status(200).json({ ok: false, error: err.message });
    }
  }

  // 2. Handle GET request for Health Check / Webhook Registration
  if (req.method === 'GET') {
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'abdallahpro.vercel.app';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const webhookUrl = `${protocol}://${host}/api/webhook`;

    if (req.query.set_webhook === 'true' && bot) {
      try {
        await bot.telegram.setWebhook(webhookUrl);
        return res.status(200).json({
          status: 'success',
          message: 'تم تفعيل الـ Webhook الخاص ببوت رحلة عبدالله بنجاح!',
          webhookUrl
        });
      } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message });
      }
    }

    return res.status(200).send(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>منظومة رحلة عبدالله (Abdullah's Journey OS)</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800;900&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Cairo', system-ui, sans-serif; background: #07090e; color: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
          .card { background: #0f172a; border-radius: 24px; padding: 40px; max-width: 540px; width: 100%; border: 1px solid rgba(56, 189, 248, 0.2); text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.7); }
          .badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; border-radius: 30px; font-size: 0.9rem; font-weight: 700; background: rgba(34, 197, 94, 0.12); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); margin-bottom: 20px; }
          h1 { color: #38bdf8; font-size: 1.8rem; font-weight: 900; margin-bottom: 12px; }
          p { color: #94a3b8; line-height: 1.7; font-size: 1rem; margin-bottom: 25px; }
          .btn { display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 800; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 15px rgba(2, 132, 199, 0.4); }
          .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(2, 132, 199, 0.6); }
          .features { margin-top: 30px; text-align: right; display: grid; gap: 10px; font-size: 0.9rem; color: #cbd5e1; }
          .features span { background: #1e293b; padding: 10px 14px; border-radius: 10px; border: 1px solid #334155; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">🟢 السيرفر والمحرك الذكي جاهز ويعمل</div>
          <h1>👑 منظومة رحلة عبدالله (OS)</h1>
          <p>السيرفر السحابي جاهز لاستقبال التسجيلات الصوتية لدراسة الطب البشري، تثبيت القرآن الكريم، إتقان الإنجليزية، وتتبع العادات.</p>
          <a href="/api/webhook?set_webhook=true" class="btn">⚡ تفعيل الـ Webhook مع تليجرام</a>
          <div class="features">
            <span>🩺 الفرقة الرابعة | الفصل الدراسي السابع (450 درجة)</span>
            <span>📖 تتبع حفظ ومراجعة القرآن الكريم بالتكرار المتباعد</span>
            <span>🗣️ مدرب المحادثة الصوتية الذكي للغة الإنجليزية</span>
            <span>🧠 محرك Gemini Multi-Key فائق السرعة والمناعة ضد التوقف</span>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
