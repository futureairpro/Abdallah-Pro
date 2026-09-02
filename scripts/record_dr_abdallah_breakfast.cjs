const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function main() {
  const telegramId = 1191760477;
  const today = '2026-09-02';

  const mealPayload = {
    id: `meal_${Date.now()}`,
    telegram_id: telegramId,
    meal_name: '200 جرام كبدة، علبة تونة مفتتة، مانجا عويس، كوباية لبن',
    meal_type: 'فطار / بعد تمرين الفجر 🍳',
    calories: 710,
    protein_g: 80,
    carbs_g: 55,
    fats_g: 18,
    notes: 'وجبة ممتازة غنية بالبروتين الحيواني العالي والحديد وفيتامين أ للاستشفاء العضلي بعد الجيم',
    date: today,
    created_at: new Date().toISOString()
  };

  // 1. Update fitness_gym_logs with 80g protein
  const { data: gymRow } = await supabase.from('fitness_gym_logs').select('*').eq('date', today).maybeSingle();
  if (gymRow) {
    await supabase.from('fitness_gym_logs').update({
      protein_grams: 80,
      notes: (gymRow.notes || '') + ' | ' + mealPayload.meal_name
    }).eq('id', gymRow.id);
    console.log('✅ Updated fitness_gym_logs protein_grams to 80g');
  } else {
    await supabase.from('fitness_gym_logs').insert({
      workout_type: 'حديد وتمارين مقاومة (الصدر والبلانك)',
      muscle_groups: 'الصدر والبطن (Chest & Core)',
      duration_minutes: 45,
      protein_grams: 80,
      date: today,
      notes: mealPayload.meal_name
    });
    console.log('✅ Inserted fitness_gym_logs with 80g protein');
  }

  // 2. Store in bot_sessions for Dr. Abdallah
  const { data: sess } = await supabase.from('bot_sessions').select('*').eq('chat_id', 888477).maybeSingle();
  const meals = Array.isArray(sess?.data?.meals) ? sess.data.meals.filter(m => m.date !== today) : [];
  meals.push(mealPayload);

  await supabase.from('bot_sessions').upsert({
    chat_id: 888477,
    state: 'nutrition_store',
    data: { meals },
    updated_at: new Date().toISOString()
  });

  console.log('✅ Successfully recorded today breakfast in database: ~710 kcal, 80g protein!');
}

main().catch(console.error);
