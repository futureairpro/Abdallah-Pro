const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

// 1. UPDATE GYM LOG IN SUPABASE FOR TODAY
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function fixTodayGym() {
  const today = '2026-09-02';
  const { data: row } = await supabase.from('fitness_gym_logs').select('*').eq('date', today).maybeSingle();
  if (row) {
    await supabase.from('fitness_gym_logs').update({
      duration_minutes: 45,
      workout_type: 'حديد وتمارين مقاومة (الصدر والبلانك)',
      muscle_groups: 'الصدر والبطن (Chest & Core)'
    }).eq('id', row.id);
    console.log('✅ Updated today gym duration from 3 mins to 45 mins in database!');
  }
}

// 2. UPDATE AI_ENGINE.JS PROMPT
let aiCode = fs.readFileSync('./lib/ai_engine.js', 'utf8');

const oldGymSection = `  if (prefs.gym === true) {
    dynamicSections += \`
- 🏋️‍♂️ الجيم واللياقة: استخرج وقت التمرين بالدقائق، والعضلات المستهدفة وجرامات البروتين والماء في data.fitness_gym.
- 🥗 التغذية وحساب السعرات: استخرج أي أكل أو وجبات ذكرها مع تقدير السعرات (calories) والبروتين (protein_g) والكارب والدهون واسم الوجبة في data.nutrition.
- ⚖️ قياسات الجسم (InBody): إذا ذكر وزنه أو طوله أو نسبة دهونه استخرجها في data.body_metrics.\`;
  }`;

const newGymAndEnglishSection = `  // 🏋️‍♂️ Fitness & Gym Intelligence
  if (prefs.gym === true) {
    dynamicSections += \`
- 🏋️‍♂️ الجيم واللياقة البدنية:
  * استخرج العضلات المستهدفة (muscle_groups)، والتمارين في data.fitness_gym.
  * ⏱️ مدة التمرين (duration_minutes): إذا ذكر مدة الجيم الإجمالية بالدقائق استخرجها (مثال: ساعة ➔ 60). إذا لم يذكر مدة الجيم الكلية وذكر فقط تمارين معينة (كالبلانك أو مجموعات الصدر) ➔ ضع المدة التلقائية الواقعية للجلسة 45 دقيقة (ولا تضع 2 أو 3 دقائق أبداً إلا إذا قال بالحرف 'تمرينة سريعة 3 دقائق في البيت').\`;
  }

  // 🗣️ English & AI Chat Spaced Repetition Flashcards
  if (prefs.english !== false) {
    dynamicSections += \`
- 🗣️ الإنجليزية والفلاش كاردز بالتكرار المتباعد (Spaced Repetition English Cards):
  * إذا أرسل الطالب نصاً إنجليزياً أو محادثة دارت بينه وبين ذكاء اصطناعي (AI Chat / English text) أو جملاً ومفردات يريد حفظها:
    - قم بتفكيك الشات/النص واستخراج أهم الجمل والتراكيب والمفردات القوية (Idioms, Expressions, High-Yield Phrases, Vocabulary) في data.english_flashcards.
    - لكل بطاقة:
      * term_or_sentence: الجملة أو المصطلح بالإنجليزية بسياق طبيعي.
      * egyptian_translation: المعنى والترجمة الدقيقة بالعامية المصرية السهلة ("الزتونة بالمصري").
      * example_sentence: جملة توضيحية إضافية للاستخدام.
      * category: "ai_chat" أو "daily_expressions" أو "medical_english".\`;
  }`;

aiCode = aiCode.replace(oldGymSection, newGymAndEnglishSection);
fs.writeFileSync('./lib/ai_engine.js', aiCode, 'utf8');
console.log('✅ Updated ai_engine.js with gym realistic duration and AI English chat extraction');

fixTodayGym().catch(console.error);
