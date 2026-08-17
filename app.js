// 🌟 Abdullah's Journey OS - Master 360° Life OS Controller & Security Gateway
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { getCairoPrayerTimes } from './lib/prayer_times.js';

const AUTH_STORAGE_KEY = 'abdallah_journey_auth_token';
const AUTH_TOKEN_VAL = 'authenticated_dr_abdallah_secure_key_2026';

function normalizePasscode(str) {
  if (!str) return '';
  return str
    .trim()
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)) // Convert Arabic numbers
    .replace(/\s+/g, '')
    .toLowerCase();
}

function isValidMasterPasscode(inputStr) {
  const norm = normalizePasscode(inputStr);

  const validVariants = [
    '@bodyyy0100192168',
    'bodyyy0100192168@',
    'bodyyy0100192168',
    '@bodyyy010019168',
    'bodyyy010019168@',
    'bodyyy010019168',
    '@bodyy0100192168',
    'bodyy0100192168@',
    'bodyy0100192168',
    '@bodyy010019168',
    'bodyy010019168@',
    'bodyy010019168',
    '0100192168',
    '010019168',
    'bodyyy',
    'bodyy'
  ];

  if (validVariants.includes(norm)) return true;
  // Also pass if it contains both 'body' and ('0100' or '192' or '191')
  if (norm.includes('body') && (norm.includes('0100') || norm.includes('192') || norm.includes('191') || norm.includes('168'))) {
    return true;
  }
  return false;
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function formatEgp(num) {
  return Number(num || 0).toLocaleString('en-US') + ' ج.م';
}

function getCairoToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
}

// 🔒 Security & Authentication Gateway
function initAuthGateway() {
  const overlay = document.getElementById('authLockOverlay');
  const mainContent = document.getElementById('mainAppContent');
  const form = document.getElementById('authForm');
  const input = document.getElementById('passcodeInput');
  const errorMsg = document.getElementById('authErrorMsg');
  const lockBtn = document.getElementById('btnLockSystem');
  const toggleEye = document.getElementById('togglePasscodeEye');

  const isAuthenticated = localStorage.getItem(AUTH_STORAGE_KEY) === AUTH_TOKEN_VAL;

  if (isAuthenticated) {
    if (overlay) overlay.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block';
    initDashboard();
  } else {
    if (overlay) overlay.style.display = 'flex';
    if (mainContent) mainContent.style.display = 'none';
    if (input) input.focus();
  }

  // Toggle Password Visibility
  if (toggleEye && input) {
    toggleEye.addEventListener('click', () => {
      const isPass = input.type === 'password';
      input.type = isPass ? 'text' : 'password';
      toggleEye.textContent = isPass ? '🙈' : '👁️';
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const entered = input?.value || '';

      if (isValidMasterPasscode(entered)) {
        localStorage.setItem(AUTH_STORAGE_KEY, AUTH_TOKEN_VAL);
        if (overlay) overlay.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        if (errorMsg) errorMsg.textContent = '';
        initDashboard();
      } else {
        if (errorMsg) errorMsg.textContent = '⛔ كلمة المرور غير صحيحة، يرجى كتابة الرمز بشكل صحيح.';
        if (input) {
          input.focus();
        }
      }
    });
  }

  if (lockBtn) {
    lockBtn.addEventListener('click', () => {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      if (overlay) overlay.style.display = 'flex';
      if (mainContent) mainContent.style.display = 'none';
      if (input) {
        input.value = '';
        input.focus();
      }
    });
  }
}

function initClockAndPrayers() {
  const clockEl = document.getElementById('cairoClock');
  function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour12: true });
    if (clockEl) clockEl.textContent = `القاهرة: ${timeStr}`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // Render Cairo Live Prayer Times
  try {
    const prayers = getCairoPrayerTimes();
    const setPt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setPt('ptFajr', prayers.times.fajr);
    setPt('ptSunrise', prayers.times.sunrise);
    setPt('ptDhuhr', prayers.times.dhuhr);
    setPt('ptAsr', prayers.times.asr);
    setPt('ptMaghrib', prayers.times.maghrib);
    setPt('ptIsha', prayers.times.isha);
  } catch (e) {
    console.warn('Prayer times init error:', e);
  }
}

function initTabs() {
  const tabs = document.querySelectorAll('.nav-item, .nav-tab');
  const panes = document.querySelectorAll('.tab-pane');
  const titleEl = document.getElementById('currentSectionTitle');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetId = `tab-${tab.dataset.tab}`;
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
      if (titleEl && tab.dataset.title) {
        titleEl.textContent = tab.dataset.title;
      }
    });
  });
}

// 🩺 1. Academic Modules, Schedule, Attendance & Medical Spaced Quizzes
async function renderAcademicSection() {
  const container = document.getElementById('semester7Courses');
  const schedEl = document.getElementById('academicScheduleList');
  const attEl = document.getElementById('attendanceLogsList');
  const attRateEl = document.getElementById('attendanceRate');
  const casesEl = document.getElementById('clinicalCasesList');
  const sessionsEl = document.getElementById('studySessionsList');
  const totalStudyHoursEl = document.getElementById('totalStudyHours');
  const totalPagesEl = document.getElementById('totalPagesCovered');
  const casesCountEl = document.getElementById('casesCount');
  const sessionsCountEl = document.getElementById('sessionsCount');
  const medSpacedList = document.getElementById('medSpacedList');
  const totalMedQuizzes = document.getElementById('totalMedQuizzes');
  const medQuizzesBadge = document.getElementById('medQuizzesBadge');

  try {
    // Courses
    const { data: courses } = await supabase.from('academic_courses').select('*').eq('semester', 7).order('credit_hours', { ascending: false });
    const defaultCourses = [
      { code: 'PED401', title: 'Pediatric 1', credit_hours: 5, mod_work_marks: 12, mid_mod_marks: 25, end_module_marks: 50, pract_clin_marks: 38, total_marks: 125, is_pass_fail: false },
      { code: 'CAD402', title: 'Cardiac Disorders', credit_hours: 5, mod_work_marks: 12, mid_mod_marks: 25, end_module_marks: 50, pract_clin_marks: 38, total_marks: 125, is_pass_fail: false },
      { code: 'RSD403', title: 'Respiratory Disorders', credit_hours: 3, mod_work_marks: 7, mid_mod_marks: 15, end_module_marks: 30, pract_clin_marks: 23, total_marks: 75, is_pass_fail: false },
      { code: 'HVD404', title: 'Hematological & Vascular Disorders', credit_hours: 4, mod_work_marks: 10, mid_mod_marks: 20, end_module_marks: 40, pract_clin_marks: 30, total_marks: 100, is_pass_fail: false },
      { code: 'SKL 7', title: 'Skills 7', credit_hours: 1, mod_work_marks: 0, mid_mod_marks: 0, end_module_marks: 0, pract_clin_marks: 25, total_marks: 25, is_pass_fail: false },
      { code: 'PRF 7', title: 'Professionalism 7', credit_hours: 1, mod_work_marks: 0, mid_mod_marks: 0, end_module_marks: 0, pract_clin_marks: 0, total_marks: 0, is_pass_fail: true },
      { code: 'ELE 7', title: 'Elective 7', credit_hours: 1, mod_work_marks: 0, mid_mod_marks: 0, end_module_marks: 0, pract_clin_marks: 0, total_marks: 0, is_pass_fail: true }
    ];
    const activeList = (courses && courses.length > 0) ? courses : defaultCourses;
    let html = '';
    activeList.forEach(c => {
      html += `
        <div class="course-card">
          <div class="course-header">
            <span class="course-code">${c.code}</span>
            <span class="course-credits">${c.credit_hours} ساعات</span>
          </div>
          <div class="course-title">${c.title}</div>
          ${!c.is_pass_fail ? `
            <table class="marks-breakdown-table">
              <thead><tr><th>أعمال سنة</th><th>ميد</th><th>فاينال</th><th>إكلينيكي</th></tr></thead>
              <tbody><tr><td>${c.mod_work_marks}</td><td>${c.mid_mod_marks}</td><td>${c.end_module_marks}</td><td>${c.pract_clin_marks}</td></tr></tbody>
            </table>
          ` : `<div style="color: #94a3b8; font-size: 0.85rem; margin: 10px 0;">Pass / Fail (ساعة معتمدة)</div>`}
          <div class="course-total-badge">
            <span class="course-total-label">المجموع:</span>
            <span class="course-total-val">${c.is_pass_fail ? 'Pass / Fail' : `${c.total_marks} درجة`}</span>
          </div>
        </div>
      `;
    });
    if (container) container.innerHTML = html;

    // Medical Spaced Quizzes
    const { data: quizzes } = await supabase.from('medical_spaced_quizzes').select('*').order('created_at', { ascending: false });
    if (quizzes && quizzes.length > 0) {
      if (totalMedQuizzes) totalMedQuizzes.innerHTML = `${quizzes.length} <span class="stat-unit">سؤال</span>`;
      if (medQuizzesBadge) medQuizzesBadge.textContent = `${quizzes.length} أسئلة مبرمجة`;

      if (medSpacedList) {
        let qHtml = '';
        quizzes.forEach(q => {
          qHtml += `
            <div class="skill-card" style="border-color: rgba(56, 189, 248, 0.25);">
              <div class="item-top-row">
                <span class="skill-title">🩺 [${q.course_code}] ${q.topic || 'Clinical MCQ'}</span>
                <span class="task-status-badge ${q.is_mastered ? 'status-done' : 'status-pending'}">مستوى: ${q.repetition_level || 0}/6</span>
              </div>
              <div style="font-weight: 700; color: #f8fafc; margin: 8px 0; font-size: 1.05rem;">❓ ${q.question}</div>
              <div class="skill-takeaways">
                💡 <b>الإجابة:</b> ${q.answer_and_explanation}<br>
                ${q.doctor_pearl ? `🔬 <b>تريكة الراوند:</b> ${q.doctor_pearl}` : ''}
              </div>
            </div>
          `;
        });
        medSpacedList.innerHTML = qHtml;
      }
    }

    // Academic Schedule
    const { data: schedule } = await supabase.from('academic_schedule').select('*').eq('is_active', true);
    if (schedule && schedule.length > 0 && schedEl) {
      let sHtml = '';
      schedule.forEach(s => {
        sHtml += `
          <div class="session-item">
            <div class="item-top-row">
              <span class="item-title">📅 ${s.day_of_week}: [${s.course_code}] ${s.title}</span>
              <span class="task-status-badge status-pending">⏰ ${s.start_time} - ${s.end_time}</span>
            </div>
            <div class="item-desc">📍 المكان: ${s.location || 'الكلية'} | 🏷️ ${s.type} (تنبيه قبلها بـ ${s.reminder_mins_before || 60} دقيقة)</div>
          </div>
        `;
      });
      schedEl.innerHTML = sHtml;
    }

    // Attendance Logs
    const { data: attList } = await supabase.from('attendance_logs').select('*').order('date', { ascending: false }).limit(6);
    if (attList && attList.length > 0 && attEl) {
      let aHtml = '';
      let presentCount = 0;
      attList.forEach(a => {
        if (a.status === 'حضور') presentCount++;
        const isPresent = a.status === 'حضور';
        aHtml += `
          <div class="task-item">
            <div class="item-top-row">
              <span class="item-title">${isPresent ? '✅' : '⚠️'} [${a.course_code}] ${a.session_title}</span>
              <span class="task-status-badge ${isPresent ? 'status-done' : 'status-pending'}">${a.status}</span>
            </div>
            <div class="item-desc">
              📅 ${a.date} ${a.reason ? `| السبب: ${a.reason}` : ''}
              ${a.makeup_plan ? `<br>🔄 <b>خطة التعويض:</b> ${a.makeup_plan}` : ''}
            </div>
          </div>
        `;
      });
      attEl.innerHTML = aHtml;
      if (attRateEl) attRateEl.textContent = `نسبة الحضور: ${Math.round((presentCount / attList.length) * 100)}%`;
    }

    // Study Sessions
    const { data: sessions } = await supabase.from('study_sessions').select('*').order('date', { ascending: false }).limit(8);
    let totalMins = 0;
    let totalPages = 0;
    if (sessions && sessions.length > 0) {
      sessions.forEach(s => {
        totalMins += Number(s.duration_minutes || 0);
        totalPages += Number(s.pages_covered || 0);
      });
      if (sessionsCountEl) sessionsCountEl.textContent = `${sessions.length} جلسات`;
      let sHtml = '';
      sessions.forEach(s => {
        sHtml += `
          <div class="session-item">
            <div class="item-top-row">
              <span class="item-title">📚 [${s.course_code}] ${s.topic} ${s.was_rescheduled ? '🔄 (مؤجل)' : ''}</span>
              <span class="item-date">${s.date}</span>
            </div>
            <div class="item-desc">
              ⏱️ ${s.duration_minutes || 0} دقيقة | 📄 ${s.pages_covered || 0} صفحة
              ${s.reschedule_reason ? `<br>⚠️ <b>سبب التأجيل:</b> ${s.reschedule_reason}` : ''}
            </div>
          </div>
        `;
      });
      if (sessionsEl) sessionsEl.innerHTML = sHtml;
    }
    if (totalStudyHoursEl) totalStudyHoursEl.innerHTML = `${(totalMins / 60).toFixed(1)} <span class="stat-unit">ساعة</span>`;
    if (totalPagesEl) totalPagesEl.textContent = `${totalPages} صفحة منجزة`;

    // Cases
    const { data: cases } = await supabase.from('clinical_cases').select('*').order('date', { ascending: false }).limit(6);
    if (cases && cases.length > 0) {
      if (casesCountEl) casesCountEl.textContent = `${cases.length} حالات`;
      let cHtml = '';
      cases.forEach(c => {
        cHtml += `
          <div class="case-item">
            <div class="item-top-row"><span class="item-title">🩺 [${c.course_code}] ${c.title}</span><span class="item-date">${c.date}</span></div>
            <div class="item-desc">
              ${c.chief_complaint ? `• <b>الشكوى:</b> ${c.chief_complaint}<br>` : ''}
              ${c.provisional_diagnosis ? `• <b>التشخيص:</b> ${c.provisional_diagnosis}<br>` : ''}
              ${c.doctor_pearls ? `• 💡 <b>تريكة الراوند:</b> ${c.doctor_pearls}` : ''}
            </div>
          </div>
        `;
      });
      if (casesEl) casesEl.innerHTML = cHtml;
    }
  } catch (err) {
    console.warn('renderAcademicSection error:', err);
  }
}

// 🗣️ 2. English Spaced Flashcards Hub
async function renderEnglishSection() {
  const container = document.getElementById('englishFlashcardsGrid');
  const totalCardsEl = document.getElementById('totalEngCards');
  const masteredCardsEl = document.getElementById('masteredEngCards');

  try {
    const { data: cards } = await supabase.from('english_spaced_flashcards').select('*').order('created_at', { ascending: false });
    if (cards && cards.length > 0) {
      let masteredCount = cards.filter(c => c.is_mastered).length;
      if (totalCardsEl) totalCardsEl.innerHTML = `${cards.length} <span class="stat-unit">كلمات</span>`;
      if (masteredCardsEl) masteredCardsEl.textContent = `${masteredCount} كلمات متقنة بالكامل`;

      if (container) {
        let html = '';
        cards.forEach(c => {
          const nextReview = c.next_review_at ? c.next_review_at.slice(0, 16).replace('T', ' ') : 'قريباً';
          html += `
            <div class="skill-card" style="border-color: rgba(56, 189, 248, 0.25);">
              <div class="item-top-row">
                <span class="skill-title" style="font-size: 1.25rem;">🌟 ${c.term_or_sentence}</span>
                <span class="task-status-badge ${c.is_mastered ? 'status-done' : 'status-pending'}">مستوى: ${c.repetition_level || 0}/6</span>
              </div>
              <div style="font-weight: 800; color: #38bdf8; font-size: 1.15rem; margin: 8px 0;">🇪🇬 ${c.egyptian_translation}</div>
              ${c.example_sentence ? `<div class="skill-takeaways">📝 <i>"${c.example_sentence}"</i></div>` : ''}
              <div class="thought-footer" style="margin-top: 10px;">
                <span class="thought-cat">🏷️ ${c.usage_context || 'عام'}</span>
                <span class="thought-date">⏳ المراجعة القادمة: ${nextReview}</span>
              </div>
            </div>
          `;
        });
        container.innerHTML = html;
      }
    }
  } catch (err) {
    console.warn('renderEnglishSection error:', err);
  }
}

// 📖 3. Quran Logs
async function renderQuranSection() {
  const quranListEl = document.getElementById('quranLogsList');
  const totalQuranSessionsEl = document.getElementById('totalQuranSessions');
  const totalQuranPagesEl = document.getElementById('totalQuranPages');

  try {
    const { data: logs } = await supabase.from('quran_logs').select('*').order('created_at', { ascending: false }).limit(10);
    let totalPages = 0;
    if (logs && logs.length > 0) {
      logs.forEach(l => totalPages += Number(l.pages_count || 1));
      if (totalQuranSessionsEl) totalQuranSessionsEl.innerHTML = `${logs.length} <span class="stat-unit">جلسة</span>`;
      if (totalQuranPagesEl) totalQuranPagesEl.textContent = `${totalPages} صفحة مراجعة وحفظ`;

      let html = '';
      logs.forEach(l => {
        const starCount = Math.max(1, Math.min(5, Number(l.quality_rating || 5)));
        html += `
          <div class="quran-item">
            <div class="item-top-row"><span class="item-title">🕌 سورة ${l.surah_name} (${l.session_type})</span><span class="item-date">${l.date}</span></div>
            <div class="item-desc">📌 <b>حالة الحفظ:</b> ${l.mastery_status || 'متقن'} | ${'⭐'.repeat(starCount)}${l.from_page ? ` | 📄 صفحة ${l.from_page}` : ''}</div>
          </div>
        `;
      });
      if (quranListEl) quranListEl.innerHTML = html;
    }
  } catch (err) {
    console.warn('renderQuranSection error:', err);
  }
}

// 🌙 4. Fasting, Sunnah & Adhkar
async function renderFastingAndSunnah() {
  const today = getCairoToday();
  const dateBadge = document.getElementById('fastingTodayDate');
  if (dateBadge) dateBadge.textContent = `تاريخ اليوم: ${today}`;
  const sunanBoxVal = document.getElementById('sunanBoxVal');
  const adhkarBoxVal = document.getElementById('adhkarBoxVal');
  const duhaBoxVal = document.getElementById('duhaBoxVal');
  const qiyamBoxVal = document.getElementById('qiyamBoxVal');
  const listEl = document.getElementById('fastingLogsList');

  try {
    // 5 Prayers Status
    const { data: p } = await supabase.from('prayers_and_habits').select('*').eq('date', today).maybeSingle();
    if (p) {
      const setStatus = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || 'لم يُسجل ⚪';
      };
      setStatus('fajrStatus', p.fajr);
      setStatus('dhuhrStatus', p.dhuhr);
      setStatus('asrStatus', p.asr);
      setStatus('maghribStatus', p.maghrib);
      setStatus('ishaStatus', p.isha);
    }

    // Fasting & Sunnah Logs
    const { data: fwToday } = await supabase.from('fasting_and_worship_logs').select('*').eq('date', today).maybeSingle();
    if (fwToday) {
      if (sunanBoxVal) sunanBoxVal.textContent = `${fwToday.sunan_rawatib_count || 0} / 12 ركعة`;
      if (adhkarBoxVal) adhkarBoxVal.textContent = `صباح: ${fwToday.adhkar_morning ? '✅' : '⚪'} | مساء: ${fwToday.adhkar_evening ? '✅' : '⚪'}`;
      if (duhaBoxVal) duhaBoxVal.textContent = fwToday.duha_prayer_done ? '✅ صليت الضحى' : 'لم تسجل ⚪';
      if (qiyamBoxVal) qiyamBoxVal.textContent = fwToday.witr_prayer_done ? '✅ صليت الوتر والقيام' : 'لم تسجل ⚪';
    }

    const { data: fwHistory } = await supabase.from('fasting_and_worship_logs').select('*').order('date', { ascending: false }).limit(6);
    if (fwHistory && fwHistory.length > 0 && listEl) {
      let html = '';
      fwHistory.forEach(f => {
        html += `
          <div class="session-item">
            <div class="item-top-row">
              <span class="item-title">🌙 ${f.fasting_type ? `${f.fasting_type} (${f.fasting_completed ? '✅ تم الصيام' : 'صائم'})` : 'يوم عادي'}</span>
              <span class="item-date">${f.date}</span>
            </div>
            <div class="item-desc">
              🕌 السنن: <b>${f.sunan_rawatib_count || 0}</b> ركعة | 📿 أذكار: صباح (${f.adhkar_morning ? '✅' : '⚪'}) مساء (${f.adhkar_evening ? '✅' : '⚪'})
            </div>
          </div>
        `;
      });
      listEl.innerHTML = html;
    }
  } catch (err) {
    console.warn('renderFastingAndSunnah error:', err);
  }
}

// 🧠 5. Mental Wellness & Venting Diary
async function renderMentalWellness() {
  const grid = document.getElementById('wellnessGrid');

  try {
    const { data: logs } = await supabase.from('mental_wellness_logs').select('*').order('created_at', { ascending: false }).limit(6);
    if (logs && logs.length > 0 && grid) {
      let html = '';
      logs.forEach(l => {
        html += `
          <div class="thought-card" style="border-color: rgba(56, 189, 248, 0.25);">
            <div class="thought-content" style="font-size: 1.1rem;">“${l.venting_content}”</div>
            ${l.ai_therapeutic_feedback ? `
              <div style="background: rgba(56, 189, 248, 0.08); border-right: 3px solid #38bdf8; padding: 12px; border-radius: 8px; margin: 12px 0; font-size: 0.85rem; color: #cbd5e1;">
                💡 <b>توجيه ودعم نفسي:</b> ${l.ai_therapeutic_feedback}
              </div>
            ` : ''}
            <div class="thought-footer">
              <span class="thought-cat">🧠 الحالة: ${l.emotional_state} (⭐ ${l.mood_rating}/5)</span>
              <span class="thought-date">📅 ${l.date}</span>
            </div>
          </div>
        `;
      });
      grid.innerHTML = html;
    }
  } catch (err) {
    console.warn('renderMentalWellness error:', err);
  }
}

// 🏋️‍♂️ 6. Gym & Fitness
async function renderGymSection() {
  const container = document.getElementById('gymLogsList');
  try {
    const { data: logs } = await supabase.from('fitness_gym_logs').select('*').order('date', { ascending: false }).limit(6);
    if (logs && logs.length > 0 && container) {
      let html = '';
      logs.forEach(g => {
        html += `
          <div class="skill-card">
            <div class="skill-title">🏋️‍♂️ ${g.workout_type}</div>
            <div class="skill-meta">💪 العضلات: ${g.muscle_groups || 'عام'} | ⏱️ ${g.duration_minutes || 45} دقيقة (📅 ${g.date})</div>
            <div class="skill-takeaways">
              🍗 بروتين: ${g.protein_grams || 0}g | 💧 ماء: ${g.water_liters || 0}L
              ${g.exercises_summary ? `<br>📝 <b>التمارين:</b> ${g.exercises_summary}` : ''}
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
    }
  } catch (err) {
    console.warn('renderGymSection error:', err);
  }
}

// 🎬 7. Content Creation
async function renderContentSection() {
  const container = document.getElementById('contentPipelineList');
  try {
    const { data: rows } = await supabase.from('content_creation').select('*').order('created_at', { ascending: false }).limit(6);
    if (rows && rows.length > 0 && container) {
      let html = '';
      rows.forEach(c => {
        html += `
          <div class="skill-card">
            <div class="item-top-row">
              <span class="skill-title">🎬 ${c.title}</span>
              <span class="task-status-badge status-pending">${c.stage}</span>
            </div>
            <div class="skill-meta">📱 المنصة: ${c.platform} | 📅 ${c.date}</div>
            ${c.script_content ? `<div class="skill-takeaways">📝 <b>السكريبت:</b> ${c.script_content}</div>` : ''}
          </div>
        `;
      });
      container.innerHTML = html;
    }
  } catch (err) {
    console.warn('renderContentSection error:', err);
  }
}

// 💼 8. Work & Projects
async function renderWorkSection() {
  const container = document.getElementById('workProjectsList');
  try {
    const { data: rows } = await supabase.from('work_projects').select('*').order('created_at', { ascending: false }).limit(6);
    if (rows && rows.length > 0 && container) {
      let html = '';
      rows.forEach(w => {
        html += `
          <div class="skill-card">
            <div class="item-top-row">
              <span class="skill-title">💼 [${w.project_name}]</span>
              <span class="task-status-badge status-done">${w.status}</span>
            </div>
            <div class="skill-meta">📝 ${w.task_description}</div>
            ${Number(w.revenue_generated || 0) > 0 ? `<div style="color: #4ade80; font-weight: 800; font-size: 0.95rem; margin-top: 6px;">💵 الإيراد المحقق: ${formatEgp(w.revenue_generated)}</div>` : ''}
          </div>
        `;
      });
      container.innerHTML = html;
    }
  } catch (err) {
    console.warn('renderWorkSection error:', err);
  }
}

// 🎯 9. Tasks & Appointments
async function renderTasksAndAppointments() {
  const tasksEl = document.getElementById('tasksList');
  const apptsEl = document.getElementById('appointmentsList');
  const tasksBadge = document.getElementById('tasksBadge');
  const apptsBadge = document.getElementById('apptsBadge');
  const today = getCairoToday();

  try {
    const { data: tasks } = await supabase.from('daily_tasks').select('*').eq('date', today).order('created_at', { ascending: false });
    if (tasks && tasks.length > 0) {
      if (tasksBadge) tasksBadge.textContent = `${tasks.length} مهام`;
      let tHtml = '';
      tasks.forEach(t => {
        const isDone = t.status === 'تم الإنجاز';
        tHtml += `
          <div class="task-item">
            <div class="item-top-row">
              <span class="item-title">${isDone ? '✅' : '🟡'} ${t.title}</span>
              <span class="task-status-badge ${isDone ? 'status-done' : 'status-pending'}">${t.status}</span>
            </div>
            <div class="item-desc">⏱️ الهدف: ${t.target_duration_mins || 0} دقيقة | 🏷️ تصنيف: ${t.category} | أولوية: ${t.priority || 'متوسطة'}</div>
          </div>
        `;
      });
      if (tasksEl) tasksEl.innerHTML = tHtml;
    }

    const { data: appts } = await supabase.from('appointments_and_reminders').select('*').order('due_datetime', { ascending: true }).limit(8);
    if (appts && appts.length > 0) {
      if (apptsBadge) apptsBadge.textContent = `${appts.length} مواعيد`;
      let aHtml = '';
      appts.forEach(a => {
        const dueStr = a.due_datetime ? a.due_datetime.replace('T', ' ').slice(0, 16) : 'قريباً';
        aHtml += `
          <div class="appt-item">
            <div class="item-top-row"><span class="item-title">🔔 ${a.title}</span><span class="item-date">${dueStr}</span></div>
            ${a.notes ? `<div class="item-desc">📝 ${a.notes}</div>` : ''}
          </div>
        `;
      });
      if (apptsEl) apptsEl.innerHTML = aHtml;
    }
  } catch (err) {
    console.warn('renderTasksAndAppointments error:', err);
  }
}

// 💡 10. Thoughts & Wisdom
async function renderThoughtsSection() {
  const grid = document.getElementById('thoughtsGrid');
  try {
    const { data: thoughts } = await supabase.from('thoughts_and_wisdom').select('*').order('created_at', { ascending: false }).limit(9);
    if (thoughts && thoughts.length > 0 && grid) {
      let html = '';
      thoughts.forEach(th => {
        html += `
          <div class="thought-card">
            <div class="thought-content">“${th.content}”</div>
            <div class="thought-footer"><span class="thought-cat">🏷️ ${th.category}</span><span class="thought-date">📅 ${th.date}</span></div>
          </div>
        `;
      });
      grid.innerHTML = html;
    }
  } catch (err) {
    console.warn('renderThoughtsSection error:', err);
  }
}

// 💵 11. Finance & Wallets
async function renderFinanceSection() {
  const tableBody = document.getElementById('financeTableBody');
  const balCash = document.getElementById('balCash');
  const balVodafone = document.getElementById('balVodafone');
  const balInstapay = document.getElementById('balInstapay');
  const balBank = document.getElementById('balBank');

  try {
    const { data: sess } = await supabase.from('bot_sessions').select('*').eq('chat_id', 999999).maybeSingle();
    const liq = sess?.data?.liquidity || {};
    if (balCash) balCash.textContent = formatEgp(liq['خزنة شخصية'] || 0);
    if (balVodafone) balVodafone.textContent = formatEgp(liq['فودافون كاش'] || 0);
    if (balInstapay) balInstapay.textContent = formatEgp(liq['إنستا باي'] || 0);
    if (balBank) balBank.textContent = formatEgp(liq['بنك مصر'] || 0);

    const { data: rows } = await supabase.from('personal_finance').select('*').order('created_at', { ascending: false }).limit(15);
    if (rows && rows.length > 0 && tableBody) {
      let html = '';
      rows.forEach(r => {
        const isExp = r.type === 'مصروف';
        html += `
          <tr>
            <td>${r.date}</td>
            <td><span class="${isExp ? 'badge-expense' : 'badge-income'}">${r.type}</span></td>
            <td><b>${formatEgp(r.amount)}</b></td>
            <td>${r.description}</td>
            <td>${r.payment_method}</td>
            <td>${r.category}</td>
          </tr>
        `;
      });
      tableBody.innerHTML = html;
    }
  } catch (err) {
    console.warn('renderFinanceSection error:', err);
  }
}

// 🚀 Dashboard Init
let dashboardInitialized = false;
async function initDashboard() {
  if (dashboardInitialized) return;
  dashboardInitialized = true;

  initClockAndPrayers();
  initTabs();
  await Promise.allSettled([
    renderAcademicSection(),
    renderEnglishSection(),
    renderQuranSection(),
    renderFastingAndSunnah(),
    renderMentalWellness(),
    renderGymSection(),
    renderContentSection(),
    renderWorkSection(),
    renderTasksAndAppointments(),
    renderThoughtsSection(),
    renderFinanceSection()
  ]);
}

window.addEventListener('DOMContentLoaded', initAuthGateway);
