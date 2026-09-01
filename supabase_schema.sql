-- ==============================================================================
-- 🌟 منظومة رحلة عبدالله (Abdullah's Journey OS) - Master Multi-Tenant Medical OS
-- ==============================================================================

-- 0. 👥 سجل الطلاب والمستخدمين ونظام الاشتراكات (Multi-Tenant Users)
create table if not exists public.users (
  telegram_id bigint primary key,
  full_name text not null,
  username text,
  university text default 'كلية الطب البشري',
  academic_year text default 'الفرقة الرابعة',
  semester text default 'الترم الأول',
  academic_group text default 'عام',
  custom_courses jsonb default '[]'::jsonb,
  preferences jsonb default '{"academic":true,"english":true,"schedule":true,"islamic":true,"wellness":true,"finance":true,"gym":false,"content":false,"work":false}'::jsonb,
  role text default 'student', -- 'admin' / 'student'
  subscription_status text default 'trial', -- 'trial' / 'active' / 'expired' / 'lifetime'
  trial_ends_at timestamp with time zone default (now() + interval '3 days'),
  subscription_ends_at timestamp with time zone,
  phone_number text,
  custom_api_key text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 0.1 💳 سجل عمليات الدفع والاشتراكات (فودافون كاش وإنستا باي)
create table if not exists public.subscription_payments (
  id uuid default gen_random_uuid() primary key,
  telegram_id bigint references public.users(telegram_id) on delete cascade,
  amount numeric not null default 300,
  payment_method text not null default 'فودافون كاش',
  receipt_photo_id text,
  sender_phone text,
  status text not null default 'pending', -- 'pending', 'approved', 'rejected'
  admin_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1. 🩺 Academic Courses & Modules (الكتالوج العام للمقررات الطبية)
create table if not exists public.academic_courses (
  id uuid default gen_random_uuid() primary key,
  semester int not null,
  code text not null unique,
  title text not null,
  credit_hours numeric not null default 1,
  mod_work_marks numeric not null default 0,
  mid_mod_marks numeric not null default 0,
  end_module_marks numeric not null default 0,
  pract_clin_marks numeric not null default 0,
  total_marks numeric not null default 0,
  is_pass_fail boolean default false,
  target_gpa numeric default 4.0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 📅 جدول السكاشن والمحاضرات الجامعية الأسبوعي الثابت
create table if not exists public.academic_schedule (
  id uuid default gen_random_uuid() primary key,
  telegram_id bigint references public.users(telegram_id) on delete cascade,
  course_code text not null,
  title text not null,
  day_of_week text not null,
  start_time text not null,
  end_time text not null,
  location text,
  type text not null default 'سيكشن عملي',
  reminder_mins_before int default 60,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. 📝 سجل الحضور والغياب في السكاشن
create table if not exists public.attendance_logs (
  id uuid default gen_random_uuid() primary key,
  course_code text not null,
  session_title text not null,
  status text not null default 'حضور',
  reason text,
  makeup_plan text,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. 📚 جلسات المذاكرة والتحصيل والخطط البديلة
create table if not exists public.study_sessions (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.academic_courses(id) on delete set null,
  course_code text not null,
  topic text not null,
  session_type text not null default 'مذاكرة نظرية',
  duration_minutes numeric not null default 0,
  pages_covered numeric not null default 0,
  comprehension_rating int default 5 check (comprehension_rating between 1 and 5),
  was_rescheduled boolean default false,
  reschedule_reason text,
  notes text,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. 🏥 الحالات الإكلينيكية وراوندات المستشفى
create table if not exists public.clinical_cases (
  id uuid default gen_random_uuid() primary key,
  course_code text not null,
  title text not null,
  chief_complaint text,
  history_and_symptoms text,
  clinical_examination text,
  provisional_diagnosis text,
  differential_diagnosis text[] default '{}' not null,
  investigations_management text,
  doctor_pearls text,
  osce_checklists text,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. 🩺 بنك أسئلة وكويزات الموديولات الطبية بالتكرار المتباعد (Medical Spaced Retrieval Engine)
create table if not exists public.medical_spaced_quizzes (
  id uuid default gen_random_uuid() primary key,
  course_code text not null,
  topic text,
  question text not null,
  answer_and_explanation text not null,
  doctor_pearl text,
  repetition_level int default 0, -- 0: جديد, 1: 12h, 2: 1d, 3: 3d, 4: 7d, 5: 14d, 6: متقن
  next_review_at timestamp with time zone not null default timezone('utc'::text, now()),
  last_reviewed_at timestamp with time zone,
  is_mastered boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. 🗣️ بنك الكلمات والجمل الإنجليزية بالتكرار المتباعد (English Spaced Flashcards)
create table if not exists public.english_spaced_flashcards (
  id uuid default gen_random_uuid() primary key,
  term_or_sentence text not null,
  egyptian_translation text not null, -- الترجمة بالعامية المصرية الدارجة
  example_sentence text,
  usage_context text, -- سياق الاستخدام (طبي / يومي / محادثة)
  repetition_level int default 0, -- 0: جديد, 1: 12h, 2: 1d, 3: 3d, 4: 7d, 5: 14d, 6: متقن
  next_review_at timestamp with time zone not null default timezone('utc'::text, now()),
  last_reviewed_at timestamp with time zone,
  is_mastered boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. 📖 المصحف وتثبيت القرآن الكريم بالتكرار المتباعد
create table if not exists public.quran_logs (
  id uuid default gen_random_uuid() primary key,
  surah_name text not null,
  from_ayah int,
  to_ayah int,
  from_page int,
  to_page int,
  pages_count numeric default 1,
  session_type text not null default 'مراجعة تثبيت',
  mastery_status text default 'متقن',
  juz_number int,
  quality_rating int default 5 check (quality_rating between 1 and 5),
  next_review_date date,
  notes text,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. 🕌 سجل الصيام والسنن والأذكار المفصلة
create table if not exists public.fasting_and_worship_logs (
  id uuid default gen_random_uuid() primary key,
  date date not null unique default current_date,
  fasting_type text,
  fasting_completed boolean default false,
  sunan_rawatib_count int default 0,
  duha_prayer_done boolean default false,
  witr_prayer_done boolean default false,
  adhkar_morning boolean default false,
  adhkar_evening boolean default false,
  quran_pages_read int default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. 🧠 سجل الحالة النفسية، الاتزان الداخلي، وتفريغ المشاعر (Mental Wellness)
create table if not exists public.mental_wellness_logs (
  id uuid default gen_random_uuid() primary key,
  date date not null default current_date,
  mood_rating int default 5 check (mood_rating between 1 and 5),
  stress_level text default 'معتدل',
  energy_rating int default 5,
  emotional_state text,
  venting_content text not null,
  ai_therapeutic_feedback text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. 🏋️‍♂️ الجيم، اللياقة البدنية، والتغذية
create table if not exists public.fitness_gym_logs (
  id uuid default gen_random_uuid() primary key,
  workout_type text not null default 'حديد وتمارين مقاومة',
  muscle_groups text,
  duration_minutes numeric default 45,
  exercises_summary text,
  protein_grams numeric default 0,
  water_liters numeric default 0,
  body_weight numeric,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. 🎬 صناعة المحتوى والمونتاج
create table if not exists public.content_creation (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  platform text not null default 'يوتيوب',
  stage text not null default 'فكرة جديدة',
  script_content text,
  video_url text,
  views_count numeric default 0,
  notes text,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 13. 💼 الشغل وإدارة المشاريع (Future Air & Ventures)
create table if not exists public.work_projects (
  id uuid default gen_random_uuid() primary key,
  project_name text not null,
  task_description text not null,
  revenue_generated numeric default 0,
  status text not null default 'قيد التنفيذ',
  notes text,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 14. 🎯 المهام اليومية وجلسات التركيز (مع نظام المتابعة التلقائية)
create table if not exists public.daily_tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  category text not null default 'مذاكرة',
  target_duration_mins numeric default 0,
  status text not null default 'قيد التنفيذ',
  priority text default 'متوسطة',
  last_reminded_at timestamp with time zone,
  reminder_count int default 0,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 15. ⏰ المواعيد والتذكيرات الذكية المجدولة
create table if not exists public.appointments_and_reminders (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  due_datetime timestamp with time zone not null,
  remind_at timestamp with time zone,
  is_notified boolean default false,
  is_completed boolean default false,
  notes text,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 16. 💡 بنك الخواطر، الأفكار العميقة، وقواعد الانضباط
create table if not exists public.thoughts_and_wisdom (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  category text not null default 'فلسفة وانضباط',
  tags text[] default '{}' not null,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 17. 🚀 تطوير الذات والكتب
create table if not exists public.self_development_books (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  author_or_channel text,
  category text not null default 'كتاب وقراءة',
  pages_or_minutes numeric default 0,
  key_takeaways text,
  actionable_habits text,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 18. 🕌 الصلوات الخمس والعادات الحيوية
create table if not exists public.prayers_and_habits (
  id uuid default gen_random_uuid() primary key,
  date date not null unique default current_date,
  fajr text default 'لم يُسجل',
  dhuhr text default 'لم يُسجل',
  asr text default 'لم يُسجل',
  maghrib text default 'لم يُسجل',
  isha text default 'لم يُسجل',
  qiyam_night boolean default false,
  sunan_rawatib int default 0,
  adhkar_morning boolean default false,
  adhkar_evening boolean default false,
  sleep_hours numeric default 0,
  wake_up_time text,
  sleep_bedtime text,
  workout_done boolean default false,
  workout_notes text,
  water_liters numeric default 0,
  energy_level int default 5 check (energy_level between 1 and 5),
  daily_reflection text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 19. 💵 الخزنة والمصروفات والمالية الشخصية
create table if not exists public.personal_finance (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('إيراد', 'مصروف', 'استثمار', 'تعليم وكورسات')),
  amount numeric not null check (amount >= 0),
  category text not null default 'عام',
  payment_method text not null default 'خزنة شخصية',
  description text not null,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 20. ⚙️ جلسات البوت والمفاتيح والسيولة
create table if not exists public.bot_sessions (
  chat_id bigint primary key,
  state text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 🚀 إدخال بيانات موديولات الفرقة الرابعة رسمياً (الترم السابع والثامن)
-- ==============================================================================

-- Semester 7 (الفصل الدراسي السابع - 20 ساعة معتمدة / 450 درجة)
insert into public.academic_courses (semester, code, title, credit_hours, mod_work_marks, mid_mod_marks, end_module_marks, pract_clin_marks, total_marks, is_pass_fail)
values 
  (7, 'PED401', 'Pediatric 1', 5, 12, 25, 50, 38, 125, false),
  (7, 'CAD402', 'Cardiac Disorders', 5, 12, 25, 50, 38, 125, false),
  (7, 'RSD403', 'Respiratory Disorders', 3, 7, 15, 30, 23, 75, false),
  (7, 'HVD404', 'Hematological & Vascular Disorders', 4, 10, 20, 40, 30, 100, false),
  (7, 'SKL 7', 'Skills 7', 1, 0, 0, 0, 25, 25, false),
  (7, 'PRF 7', 'Professionalism 7', 1, 0, 0, 0, 0, 0, true),
  (7, 'ELE 7', 'Elective 7', 1, 0, 0, 0, 0, 0, true)
on conflict (code) do update set
  title = excluded.title,
  credit_hours = excluded.credit_hours,
  mod_work_marks = excluded.mod_work_marks,
  mid_mod_marks = excluded.mid_mod_marks,
  end_module_marks = excluded.end_module_marks,
  pract_clin_marks = excluded.pract_clin_marks,
  total_marks = excluded.total_marks;

-- جدول السكاشن
insert into public.academic_schedule (course_code, title, day_of_week, start_time, end_time, location, type, reminder_mins_before)
values
  ('PED401', 'راوند طب الأطفال الإكلينيكي', 'السبت', '09:00', '12:00', 'مستشفى الأطفال الجامعي', 'راوند سريري', 60),
  ('CAD402', 'سيكشن أمراض القلب ورسم القلب ECG', 'الأحد', '10:00', '12:30', 'مبنى المهارات الإكلينيكية', 'سيكشن عملي', 60),
  ('RSD403', 'سيكشن أمراض الصدر وأشعة X-Ray', 'الثلاثاء', '09:30', '11:30', 'مستشفى الصدر الجامعي', 'راوند سريري', 60),
  ('HVD404', 'راوند أمراض الدم والأوعية الدموية', 'الأربعاء', '10:00', '12:00', 'قسم الباطنة العامة', 'راوند سريري', 60),
  ('SKL 7', 'سيكشن المهارات الإكلينيكية (OSCE Skills)', 'الخميس', '09:00', '11:00', 'معمل المحاكاة الطبية', 'سيكشن عملي', 60)
on conflict do nothing;

-- Initial Bot Session & Liquidity Accounts Configuration
insert into public.bot_sessions (chat_id, state, data)
values (
  999999,
  'system_config',
  '{
    "liquidity": {
      "خزنة شخصية": 0,
      "فودافون كاش": 0,
      "إنستا باي": 0,
      "بنك مصر": 0
    },
    "GEMINI_API_KEYS": "AQ.Ab8RN6KWeyA97I9jIVfVZp82VCWIshzVd5H3zT7k6qIooYeotA,AQ.Ab8RN6KRhjZydNIseJQd0AJ7UZ1iKUZXiuaq9K9wJEcW0cF-ng,AQ.Ab8RN6L9TYzSxv02kkJ8NJxNWN6-lcPV6iFJi48FuvzDuqH_YQ"
  }'::jsonb
)
on conflict (chat_id) do nothing;

-- ==============================================================================
-- ⚡ Indexes for Ultra-Fast Queries
-- ==============================================================================
create index if not exists idx_med_spaced_next on public.medical_spaced_quizzes(next_review_at);
create index if not exists idx_eng_spaced_next on public.english_spaced_flashcards(next_review_at);
create index if not exists idx_schedule_day on public.academic_schedule(day_of_week);
create index if not exists idx_attendance_date on public.attendance_logs(date);
create index if not exists idx_study_sessions_date on public.study_sessions(date);
create index if not exists idx_quran_logs_date on public.quran_logs(date);
create index if not exists idx_fasting_date on public.fasting_and_worship_logs(date);
create index if not exists idx_mental_wellness_date on public.mental_wellness_logs(date);
create index if not exists idx_tasks_date on public.daily_tasks(date);
create index if not exists idx_thoughts_date on public.thoughts_and_wisdom(date);
create index if not exists idx_personal_finance_date on public.personal_finance(date);

-- ==============================================================================
-- 🥗 21. سجل قياسات وفحص الجسم وحساب السعرات (InBody & Body Profile)
-- ==============================================================================
create table if not exists public.user_body_metrics (
  telegram_id bigint primary key references public.users(telegram_id) on delete cascade,
  height_cm numeric default 175,
  weight_kg numeric default 75,
  body_fat_pct numeric default 18,
  muscle_mass_kg numeric default 35,
  bmr numeric default 1700,
  tdee numeric default 2300,
  fitness_goal text default 'تنشيف وحرق دهون', -- 'تنشيف وحرق دهون', 'تضخيم وبناء عضل', 'الحفاظ على الوزن واللياقة'
  target_calories numeric default 2000,
  target_protein_g numeric default 150,
  target_carbs_g numeric default 180,
  target_fats_g numeric default 55,
  target_water_l numeric default 3.5,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 🍽️ 22. سجل الوجبات والتغذية اليومية والسعرات (Nutrition & Macro Logs)
-- ==============================================================================
create table if not exists public.nutrition_logs (
  id uuid default gen_random_uuid() primary key,
  telegram_id bigint references public.users(telegram_id) on delete cascade,
  meal_name text not null,
  meal_type text default 'وجبة رئيسية', -- 'إفطار', 'غداء', 'عشاء', 'سناك / قبل التمرين', 'سناك / بعد التمرين'
  calories numeric default 0,
  protein_g numeric default 0,
  carbs_g numeric default 0,
  fats_g numeric default 0,
  notes text,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 🛑 23. رادار تشتت الانتباه ومحاربة التسويف (Distraction & Procrastination Radar)
-- ==============================================================================
create table if not exists public.distraction_logs (
  id uuid default gen_random_uuid() primary key,
  telegram_id bigint references public.users(telegram_id) on delete cascade,
  distraction_source text not null, -- 'سوشيال ميديا وريلز', 'يوتيوب وتصفح عشوائي', 'ألعاب ومكالمات', 'تشتت ذهني وخمول'
  duration_minutes numeric not null default 30,
  trigger_reason text,
  discipline_rating int default 3 check (discipline_rating between 1 and 5),
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 🏆 24. نظام الرتب والخبرة والشارات وشعلة الانضباط (Doctor XP & Streaks)
-- ==============================================================================
create table if not exists public.user_gamification (
  telegram_id bigint primary key references public.users(telegram_id) on delete cascade,
  doctor_xp numeric default 0,
  level int default 1,
  rank_title text default 'Student Doctor (طالب طب متميز)',
  unlocked_badges jsonb default '[]'::jsonb,
  current_streak int default 1,
  best_streak int default 1,
  last_active_date date default current_date,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 📦 25. قائمة النواقص والمستلزمات وكانبان المشتريات (Wishlist & Inventory)
-- ==============================================================================
create table if not exists public.wishlist_items (
  id uuid default gen_random_uuid() primary key,
  telegram_id bigint references public.users(telegram_id) on delete cascade,
  title text not null,
  category text default 'مستلزمات طبية', -- 'مستلزمات طبية', 'أجهزة وإلكترونيات', 'كتب وملازم', 'شخصي وعام'
  estimated_cost numeric default 0,
  priority text default 'متوسطة', -- 'عاجل', 'متوسطة', 'لاحقاً'
  status text default 'pending', -- 'pending', 'bought', 'cancelled'
  notes text,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 📚 26. خزنة ملفات الموديولات والـ PDFs والامتحانات السابقة (Academic PDF Vault)
-- ==============================================================================
create table if not exists public.academic_pdf_vault (
  id uuid default gen_random_uuid() primary key,
  course_code text not null,
  file_name text not null,
  topic_title text not null,
  high_yield_summary jsonb default '[]'::jsonb,
  mcqs_extracted jsonb default '[]'::jsonb,
  english_terms jsonb default '[]'::jsonb,
  osce_pearls jsonb default '[]'::jsonb,
  file_size_mb numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 📝 27. سجل الأنشطة والأحداث الحرة المرنة (Universal Flexible Free Logs)
-- ==============================================================================
create table if not exists public.flexible_free_logs (
  id uuid default gen_random_uuid() primary key,
  telegram_id bigint references public.users(telegram_id) on delete cascade,
  category text default 'أخرى',
  title text not null,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ⚡ New Indexes
create index if not exists idx_nutrition_date on public.nutrition_logs(date);
create index if not exists idx_distraction_date on public.distraction_logs(date);
create index if not exists idx_wishlist_status on public.wishlist_items(status);
create index if not exists idx_flexible_date on public.flexible_free_logs(date);

-- ==============================================================================
-- 📖 28. منظومة التكرار المتباعد والتثبيت العلمي للقرآن (Scientific Quran Spaced Mastery)
-- ==============================================================================
create table if not exists public.quran_spaced_mastery (
  id uuid default gen_random_uuid() primary key,
  telegram_id bigint references public.users(telegram_id) on delete cascade,
  surah_name text not null,
  from_page int,
  to_page int,
  from_ayah int,
  to_ayah int,
  pages_count numeric default 1,
  learning_mode text not null default 'auditory_listening', -- auditory_listening | visual_memorization | recitation_review
  repetition_stage int not null default 1, -- 1: 8-12h, 2: 24h, 3: 3d, 4: 7d, 5: 15d, 6: 30d (Mastered)
  mastery_pct int not null default 20, -- 20% to 100%
  mastery_status text default 'تثبيت أولي', -- حفظ جديد | تثبيت أولي | مراجعة متباعدة | متقن راسخ
  last_reviewed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  next_review_at timestamp with time zone,
  reminder_appt_id uuid references public.appointments_and_reminders(id) on delete set null,
  review_history jsonb default '[]'::jsonb,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_quran_spaced_next on public.quran_spaced_mastery(next_review_at);
create index if not exists idx_quran_spaced_user on public.quran_spaced_mastery(telegram_id);

-- ==============================================================================
-- 🩺 29. منظومة التكرار المتباعد والتثبيت العصبي الأكاديمي (Academic Spaced Mastery)
-- ==============================================================================
create table if not exists public.academic_spaced_mastery (
  id uuid default gen_random_uuid() primary key,
  telegram_id bigint references public.users(telegram_id) on delete cascade,
  course_code text not null,
  topic text not null,
  from_page int,
  to_page int,
  pages_count numeric default 1,
  repetition_stage int not null default 1, -- 1: 10h, 2: 24h, 3: 3d, 4: 7d, 5: 15d, 6: 30d (Mastered)
  mastery_pct int not null default 25, -- 25% to 100%
  mastery_status text default 'تثبيت أولي', -- تثبيت أولي | مراجعة متباعدة | متقن راسخ
  pdf_vault_id uuid references public.academic_pdf_vault(id) on delete set null,
  mcqs_generated_count int default 0,
  last_reviewed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  next_review_at timestamp with time zone,
  reminder_appt_id uuid references public.appointments_and_reminders(id) on delete set null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_acad_spaced_next on public.academic_spaced_mastery(next_review_at);
create index if not exists idx_acad_spaced_user on public.academic_spaced_mastery(telegram_id);

-- ==============================================================================
-- 🛡️ 30. قلعة السيادة والتعافي العصبي وإعادة ضبط الدوبامين (Admin Purity Recovery Vault)
-- [حصري وخاص فقط بحساب الأدمن 1191760477]
-- ==============================================================================
create table if not exists public.admin_purity_recovery (
  telegram_id bigint primary key references public.users(telegram_id) on delete cascade,
  last_soso_relapse_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_bobo_relapse_at timestamp with time zone default timezone('utc'::text, now()) not null,
  longest_soso_streak_days int default 0,
  longest_bobo_streak_days int default 0,
  urges_resisted_count int default 0,
  relapse_history jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_admin_purity_user on public.admin_purity_recovery(telegram_id);



