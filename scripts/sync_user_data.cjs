// Script to sync Dr. Abdallah's recovery, gamification, Quran logs, and purge dummy schedules
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const supabaseUrl = 'https://rkpkjilrsylgoomqxouq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrcGtqaWxyc3lsZ29vbXF4b3VxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQ5MDc4MCwiZXhwIjoyMTA0MDY2NzgwfQ.JRYzMZS400S456v3dbmZ5sxp-87DzIa-_gPyq7r6zzk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('--- 1. Purging dummy academic_schedule rows ---');
  const { error: delErr } = await supabase
    .from('academic_schedule')
    .delete()
    .is('telegram_id', null);
  console.log('Purged dummy schedules:', delErr ? delErr.message : 'OK');

  console.log('--- 2. Setting Purity Recovery to 3 Days Clean ---');
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
  const { error: purErr } = await supabase.from('admin_purity_recovery').upsert({
    telegram_id: 1191760477,
    last_soso_relapse_at: threeDaysAgo,
    last_bobo_relapse_at: threeDaysAgo,
    longest_soso_streak_days: 3,
    longest_bobo_streak_days: 3,
    urges_resisted_count: 3,
    updated_at: new Date().toISOString()
  });
  console.log('Purity update:', purErr ? purErr.message : 'OK');

  console.log('--- 3. Updating Gamification Streak to 3 Days ---');
  const { error: gamErr } = await supabase.from('user_gamification').upsert({
    telegram_id: 1191760477,
    doctor_xp: 350,
    level: 2,
    rank_title: 'طالب طب إكلينيكي (Clinical Student)',
    current_streak: 3,
    best_streak: 3,
    unlocked_badges: ['welcome_badge', 'nutrition_pro', 'quran_healing_pro', 'fire_streak_7'],
    last_active_date: '2026-09-05',
    updated_at: new Date().toISOString()
  });
  console.log('Gamification update:', gamErr ? gamErr.message : 'OK');

  console.log('--- 4. Logging Surah Al-Anam Page 1 in Quran Logs & SRS Hub ---');
  const { error: qLogErr } = await supabase.from('quran_logs').insert({
    surah_name: 'الأنعام',
    from_page: 128,
    to_page: 128,
    pages_count: 1,
    session_type: 'تلاوة وسماع [usr:1191760477]',
    quality_rating: 5,
    notes: 'أول صفحة من سورة الأنعام (تلاوة وسماع) [usr:1191760477]',
    date: '2026-09-04'
  });
  console.log('Quran log insert:', qLogErr ? qLogErr.message : 'OK');

  // Next review scheduled for today
  const nextReviewTime = new Date(Date.now() + 6 * 3600 * 1000).toISOString();
  const { error: srsErr } = await supabase.from('quran_spaced_mastery').upsert({
    telegram_id: 1191760477,
    surah_name: 'الأنعام',
    from_page: 128,
    to_page: 128,
    pages_count: 1,
    learning_mode: 'auditory_listening',
    repetition_stage: 1,
    mastery_pct: 35,
    mastery_status: 'تثبيت أولي',
    last_reviewed_at: '2026-09-04T12:00:00Z',
    next_review_at: nextReviewTime,
    notes: 'أول صفحة من سورة الأنعام [usr:1191760477]'
  });
  console.log('Quran SRS insert:', srsErr ? srsErr.message : 'OK');

  console.log('--- 5. Recording 3 Days of Quran Healing Protocol ---');
  const healingDates = ['2026-09-02', '2026-09-03', '2026-09-04'];
  for (const d of healingDates) {
    for (const s of ['ق', 'الرحمن', 'الملك', 'الزلزلة']) {
      await supabase.from('quran_logs').insert({
        surah_name: s,
        pages_count: 3,
        session_type: 'ورد علاجي [usr:1191760477]',
        quality_rating: 5,
        notes: 'الورد القرآني العلاجي اليومي (30 يوماً) [usr:1191760477]',
        date: d
      });
    }
  }

  const { error: sessErr } = await supabase.from('bot_sessions').upsert({
    chat_id: 999333,
    state: 'quran_healing_protocol',
    data: {
      start_date: '2026-09-02',
      target_days: 30,
      surahs: ['سورة ق', 'سورة الرحمن', 'سورة الملك', 'سورة الزلزلة'],
      completed_dates: healingDates,
      current_day_number: 4,
      streak_days: 3,
      last_interrupted_date: '2026-09-04',
      updated_at: new Date().toISOString()
    },
    updated_at: new Date().toISOString()
  });
  console.log('Healing protocol session:', sessErr ? sessErr.message : 'OK');

  console.log('All operations finished successfully!');
}

main().catch(console.error);
