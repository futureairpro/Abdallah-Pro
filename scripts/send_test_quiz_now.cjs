const dotenv = require('dotenv');
dotenv.config();
const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const adminChatId = 1191760477;

async function main() {
  const quizData = {
    title: 'قاعدة سجود السهو في دقيقة واحدة',
    question: '🕌 فقه الصلاة: لو نسيت التشهد الأول وقمت للركعة الثالثة، تسجد للسهو أمتى؟',
    options: [
      'قبل السلام (لأنه نقص)',
      'بعد السلام (لأنه زيادة)',
      'لا يلزم سجود سهو'
    ],
    correct_option_index: 0,
    explanation: 'لأن نسيان التشهد الأول هو سهو بالنقص، والقاعدة: السهو بالنقص يسجد له قبل السلام.'
  };

  const intro = `📖 <b>سؤال الفقه والعلم الشرعي للتثبيت:</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `📌 <b>الموضوع:</b> <b>${quizData.title}</b>\n\n` +
    `👇 <i>اختر إجابتك من الاستطلاع التفاعلي التالي لتجربة المنظومة (+30 Doctor XP):</i>`;

  await bot.telegram.sendMessage(adminChatId, intro, { parse_mode: 'HTML' });

  const pollMsg = await bot.telegram.sendPoll(
    adminChatId,
    quizData.question,
    quizData.options,
    {
      type: 'quiz',
      correct_option_id: quizData.correct_option_index,
      explanation: `💡 ${quizData.explanation}`,
      is_anonymous: false
    }
  );

  const metaObj = {
    poll_id: pollMsg.poll.id,
    options: quizData.options,
    correct_index: quizData.correct_option_index,
    explanation: quizData.explanation
  };

  await supabase.from('medical_spaced_quizzes').insert({
    course_code: 'SHARIA',
    topic: `[UID:${adminChatId}] ${quizData.title}`,
    question: quizData.question,
    answer_and_explanation: quizData.explanation,
    doctor_pearl: `<<<QUIZ_META_START>>>${JSON.stringify(metaObj)}<<<QUIZ_META_END>>> ${quizData.explanation}`,
    repetition_level: 0,
    telegram_poll_id: pollMsg.poll.id,
    next_review_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString()
  });

  console.log('✅ Interactive Quiz Poll sent successfully with Poll ID:', pollMsg.poll.id);
}

main().catch(console.error);
