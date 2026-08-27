// 🌟 Abdullah's Journey OS - Master 360° Life OS Controller & Security Gateway

const SUPABASE_URL = 'https://iluvbcadeteawbyrlqmo.supabase.co';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsdXZiY2FkZXRlYXdieXJscW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NzYzMjAsImV4cCI6MjEwMjU1MjMyMH0.sMZqoW6697HLOCNb5CJFO47ZQzjCBRw7KBIxLfvtI6g';

let _dbInstance = null;

function getDb() {

  if (_dbInstance) return _dbInstance;

  if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {

    _dbInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    return _dbInstance;

  }

  return null;

}

const db = new Proxy({}, {

  get(target, prop) {

    const client = getDb();

    if (client && typeof client[prop] === 'function') {

      return client[prop].bind(client);

    }

    return client ? client[prop] : undefined;

  }

});

const DEFAULT_USER_PREFERENCES = {
  academic: true,    // 🩺 كويزات ومذاكرة الطب (Locked True)
  english: true,     // 🗣️ مدرب وفلاش كاردز الإنجليزية
  schedule: true,    // 📅 جدول السكاشن والغياب
  islamic: true,     // 🕌 القسم الروحي (القرآن، الصيام، الأذكار، الصلوات)
  wellness: true,    // 🧠 الفضفضة والاتزان النفسي
  finance: true,     // 💵 الخزنة والمصروفات الشخصية
  gym: false,        // 🏋️‍♂️ الجيم واللياقة البدنية
  content: false,    // 🎬 صناعة المحتوى والمونتاج
  work: false        // 💼 مشاريع البيزنس والشغل
};

const PRESET_COURSES_BY_YEAR = {
  'الفرقة الأولى': {
    'الترم الأول': [
      { code: 'ANAT101', title: 'Anatomy 1 (تشريح عام)' },
      { code: 'PHYS101', title: 'Physiology 1 (علم وظائف الأعضاء)' },
      { code: 'HIST101', title: 'Histology 1 (علم الأنسجة)' },
      { code: 'BIOC101', title: 'Biochemistry 1 (كيمياء حيوية)' }
    ],
    'الترم الثاني': [
      { code: 'ANAT102', title: 'Anatomy 2 (تشريح أحشاء وأطراف)' },
      { code: 'PHYS102', title: 'Physiology 2 (فسيولوجي أجهزة)' },
      { code: 'HIST102', title: 'Histology 2 (هستولوجي خاص)' },
      { code: 'BIOC102', title: 'Biochemistry 2 (جينات وبيوكيمستري)' }
    ]
  },
  'الفرقة الثانية': {
    'الترم الأول': [
      { code: 'PATH201', title: 'General Pathology (علم الأمراض العام)' },
      { code: 'PHAR201', title: 'General Pharmacology (علم الأدوية العام)' },
      { code: 'MICR201', title: 'Microbiology & Immunology (ميكروبيولوجي ومناعة)' },
      { code: 'PARA201', title: 'Parasitology (طفيليات)' }
    ],
    'الترم الثاني': [
      { code: 'PATH202', title: 'Systemic Pathology (باثولوجي أجهزة)' },
      { code: 'PHAR202', title: 'Systemic Pharmacology (فارما أجهزة)' },
      { code: 'MICR202', title: 'Systemic Microbiology (ميكرو أجهزة)' },
      { code: 'COMM202', title: 'Community Medicine (طب المجتمع)' }
    ]
  },
  'الفرقة الثالثة': {
    'الترم الأول': [
      { code: 'SURG301', title: 'General Surgery 1 (مقدمة الجراحة العامة)' },
      { code: 'IMED301', title: 'Internal Medicine 1 (مقدمة الباطنة العامة)' },
      { code: 'FORE301', title: 'Forensic Medicine & Tox (طب شرعي وسموم)' },
      { code: 'OPHT301', title: 'Ophthalmology (طب وجراحة العيون)' }
    ],
    'الترم الثاني': [
      { code: 'SURG302', title: 'General Surgery 2 (جراحة سريرية)' },
      { code: 'IMED302', title: 'Internal Medicine 2 (باطنة سريرية)' },
      { code: 'ENT302', title: 'ENT (أنف وأذن وحنجرة)' },
      { code: 'PMR302', title: 'Physical Medicine & Rehab (تأهيل وعلاج طبيعي)' }
    ]
  },
  'الفرقة الرابعة': {
    'الترم الأول': [
      { code: 'PED401', title: 'Pediatrics 1 (طب الأطفال 1)' },
      { code: 'CAD402', title: 'Cardiac Disorders (أمراض القلب والأوعية)' },
      { code: 'RSD403', title: 'Respiratory Disorders (أمراض الجهاز التنفسي)' },
      { code: 'HVD404', title: 'Hematological Disorders (أمراض الدم والأوعية)' },
      { code: 'SKL 7', title: 'Clinical Skills 7 (المهارات الإكلينيكية)' }
    ],
    'الترم الثاني': [
      { code: 'PED402', title: 'Pediatrics 2 (طب الأطفال المتقدم)' },
      { code: 'GIT402', title: 'Gastroenterology & Hepatology (باطنة وجهاز هضمي)' },
      { code: 'NEPH403', title: 'Nephrology & Urology (كلى ومسالك)' },
      { code: 'ENDO404', title: 'Endocrine & Metabolic (غدد صماء وسكر)' },
      { code: 'SKL 8', title: 'Clinical Skills 8 (المهارات الإكلينيكية 8)' }
    ]
  },
  'الفرقة الخامسة': {
    'الترم الأول': [
      { code: 'MED501', title: 'Advanced Internal Medicine (باطنة متقدمة ورعاية)' },
      { code: 'SURG501', title: 'Advanced General Surgery (جراحة عامة وتخصصية)' },
      { code: 'OBGY501', title: 'Obstetrics & Gynecology 1 (نساء وتوليد 1)' },
      { code: 'PEDI501', title: 'Clinical Pediatrics (أطفال إكلينيكي)' }
    ],
    'الترم الثاني': [
      { code: 'OBGY502', title: 'Obstetrics & Gynecology 2 (نساء وتوليد متقدم)' },
      { code: 'ORTH502', title: 'Orthopedics & Traumatology (عظام وكسور)' },
      { code: 'NEUR502', title: 'Neurology & Neurosurgery (مخ وأعصاب)' },
      { code: 'EMER502', title: 'Emergency & Critical Care (طوارئ وعناية مركزة)' }
    ]
  },
  'الامتياز': {
    'الترم الأول': [
      { code: 'ROT_SURG', title: 'Surgery Rotation (راوند الجراحة العامة)' },
      { code: 'ROT_IMED', title: 'Internal Medicine Rotation (راوند الباطنة العامة)' },
      { code: 'ROT_PEDI', title: 'Pediatrics Rotation (راوند الأطفال)' },
      { code: 'ROT_OBGY', title: 'OB/GYN Rotation (راوند النساء والتوليد)' },
      { code: 'ROT_EMER', title: 'Emergency Rotation (راوند الطوارئ والحوادث)' }
    ]
  }
};

function getCourseIcon(title = '', code = '') {
  const t = (title + ' ' + code).toLowerCase();
  if (t.includes('pediat') || t.includes('أطفال')) return '👶';
  if (t.includes('card') || t.includes('قلب')) return '🫀';
  if (t.includes('resp') || t.includes('صدر') || t.includes('تنفس')) return '🫁';
  if (t.includes('hemat') || t.includes('دم')) return '🩸';
  if (t.includes('skill') || t.includes('مهار')) return '🩺';
  if (t.includes('gastro') || t.includes('هضم') || t.includes('كبد') || t.includes('git')) return '🫄';
  if (t.includes('neph') || t.includes('كلى') || t.includes('مسالك')) return '🫘';
  if (t.includes('endo') || t.includes('غدد') || t.includes('سكر')) return '🧬';
  if (t.includes('path') || t.includes('أمراض')) return '🔬';
  if (t.includes('phar') || t.includes('أدوي')) return '💊';
  if (t.includes('micr') || t.includes('مناع') || t.includes('ميكرو')) return '🦠';
  if (t.includes('para') || t.includes('طفيلي')) return '🪱';
  if (t.includes('anat') || t.includes('تشريح')) return '🦴';
  if (t.includes('phys') || t.includes('وظائف')) return '⚡';
  if (t.includes('hist') || t.includes('أنسجة')) return '🧪';
  if (t.includes('bioc') || t.includes('كيمياء')) return '⚗️';
  if (t.includes('surg') || t.includes('جراح')) return '🔪';
  if (t.includes('obgy') || t.includes('نساء') || t.includes('توليد')) return '🤰';
  if (t.includes('emer') || t.includes('طوارئ') || t.includes('حوادث')) return '🚨';
  if (t.includes('orth') || t.includes('عظام')) return '🩻';
  if (t.includes('neur') || t.includes('أعصاب') || t.includes('مخ')) return '🧠';
  if (t.includes('opht') || t.includes('عيون')) return '👁️';
  if (t.includes('ent') || t.includes('أنف')) return '👂';
  return '📚';
}

// Cairo Prayer Times Engine

// Cairo Live & Accurate Prayer Times Engine
const CLIENT_PRAYER_CACHE = new Map();

async function initLiveCairoPrayers(date = new Date()) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  const dateStr = `${d}-${m}-${y}`;
  const dateKey = `${y}-${m}-${d}`;

  try {
    const cached = localStorage.getItem(`cairo_prayers_${dateKey}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      CLIENT_PRAYER_CACHE.set(dateKey, parsed);
      return parsed;
    }

    const res = await fetch(`https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=Cairo&country=Egypt&method=5`);
    if (res.ok) {
      const data = await res.json();
      const t = data.data?.timings;
      if (t) {
        const cleanTime = (val) => val.split(' ')[0].trim();
        const times = {
          fajr: cleanTime(t.Fajr),
          sunrise: cleanTime(t.Sunrise),
          dhuhr: cleanTime(t.Dhuhr),
          asr: cleanTime(t.Asr),
          maghrib: cleanTime(t.Maghrib),
          isha: cleanTime(t.Isha)
        };

        const format12H = tStr => {
          if (!tStr) return '';
          const [hStr, mStr] = tStr.split(':');
          let h = parseInt(hStr, 10);
          const sfx = h >= 12 ? 'م' : 'ص';
          h = h % 12;
          if (h === 0) h = 12;
          return `${String(h).padStart(2, '0')}:${mStr} ${sfx}`;
        };

        const prayerObj = {
          fajr: times.fajr,
          sunrise: times.sunrise,
          dhuhr: times.dhuhr,
          asr: times.asr,
          maghrib: times.maghrib,
          isha: times.isha,
          formatted: {
            fajr: format12H(times.fajr),
            sunrise: format12H(times.sunrise),
            dhuhr: format12H(times.dhuhr),
            asr: format12H(times.asr),
            maghrib: format12H(times.maghrib),
            isha: format12H(times.isha)
          }
        };

        CLIENT_PRAYER_CACHE.set(dateKey, prayerObj);
        localStorage.setItem(`cairo_prayers_${dateKey}`, JSON.stringify(prayerObj));
        return prayerObj;
      }
    }
  } catch (_) {}
  return null;
}

try {
  initLiveCairoPrayers().catch(() => {});
} catch (_) {}

function getCairoPrayerTimes(date = new Date()) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  const dateKey = `${y}-${m}-${d}`;

  if (CLIENT_PRAYER_CACHE.has(dateKey)) {
    return CLIENT_PRAYER_CACHE.get(dateKey);
  }

  const cachedStorage = typeof localStorage !== 'undefined' ? localStorage.getItem(`cairo_prayers_${dateKey}`) : null;
  if (cachedStorage) {
    try {
      const parsed = JSON.parse(cachedStorage);
      CLIENT_PRAYER_CACHE.set(dateKey, parsed);
      return parsed;
    } catch (_) {}
  }

  const CAIRO_LAT = 30.0444;
  const CAIRO_LNG = 31.2357;
  const degToRad = d => (d * Math.PI) / 180.0;
  const radToDeg = r => (r * 180.0) / Math.PI;

  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = (date - startOfYear) + ((startOfYear.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const b = (2 * Math.PI * (dayOfYear - 81)) / 365;
  const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  const declination = 23.45 * Math.sin(degToRad((360 / 365) * (dayOfYear - 81)));

  let timezoneOffset = 3;
  const solarNoon = 12 + timezoneOffset - (CAIRO_LNG / 15) - (eot / 60);

  function getHourAngle(angle, isAboveHorizon = false) {
    const latRad = degToRad(CAIRO_LAT);
    const decRad = degToRad(declination);
    const targetAngleRad = degToRad(angle);

    const cosH = isAboveHorizon
      ? (Math.sin(targetAngleRad) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad))
      : (-Math.sin(targetAngleRad) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));

    if (cosH > 1 || cosH < -1) return null;
    return radToDeg(Math.acos(cosH)) / 15.0;
  }

  const fajrHA = getHourAngle(19.5, false) || 1.6;
  const sunriseHA = getHourAngle(0.833, false) || 1.4;
  const asrAltitude = radToDeg(Math.atan(1 / (1 + Math.tan(Math.abs(degToRad(CAIRO_LAT) - degToRad(declination))))));
  const asrHA = getHourAngle(asrAltitude, true) || 1.1;
  const maghribHA = sunriseHA;
  const ishaHA = getHourAngle(17.5, false) || 1.5;

  const toTimeStr = hDec => {
    const totalM = Math.round(hDec * 60);
    const h = Math.floor(totalM / 60) % 24;
    const mn = totalM % 60;
    return `${String(h).padStart(2, '0')}:${String(mn).padStart(2, '0')}`;
  };

  const format12H = tStr => {
    if (!tStr) return '';
    const [hStr, mStr] = tStr.split(':');
    let h = parseInt(hStr, 10);
    const sfx = h >= 12 ? 'م' : 'ص';
    h = h % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${mStr} ${sfx}`;
  };

  const tFajr = toTimeStr(solarNoon - fajrHA);
  const tSunrise = toTimeStr(solarNoon - sunriseHA);
  const tDhuhr = toTimeStr(solarNoon + (1 / 60));
  const tAsr = toTimeStr(solarNoon + asrHA);
  const tMaghrib = toTimeStr(solarNoon + maghribHA); // Exact sunset
  const tIsha = toTimeStr(solarNoon + ishaHA);

  return {
    fajr: tFajr, sunrise: tSunrise, dhuhr: tDhuhr, asr: tAsr, maghrib: tMaghrib, isha: tIsha,
    formatted: {
      fajr: format12H(tFajr), sunrise: format12H(tSunrise), dhuhr: format12H(tDhuhr),
      asr: format12H(tAsr), maghrib: format12H(tMaghrib), isha: format12H(tIsha)
    }
  };
}

function formatEgp(num) {

  return Number(num || 0).toLocaleString('en-US') + ' ج.م';

}

function getCairoToday() {

  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });

}

// 🕒 Smart Arabic Relative Date & Time Formatter (Compact & Clean)
function formatRelativeDate(dateStr, createdAtStr = null) {
  if (!dateStr && !createdAtStr) return 'الآن';
  const todayStr = getCairoToday();
  let timePortion = '';
  if (createdAtStr) {
    try {
      const createdDate = new Date(createdAtStr);
      timePortion = createdDate.toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (e) {}
  }

  let targetDateStr = dateStr;
  if (!targetDateStr && createdAtStr) {
    try {
      targetDateStr = new Date(createdAtStr).toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
    } catch (e) {}
  }

  if (!targetDateStr || targetDateStr === todayStr) {
    return timePortion ? `اليوم ${timePortion}` : 'اليوم';
  }

  try {
    const dToday = new Date(todayStr);
    const dTarget = new Date(targetDateStr);
    const diffDays = Math.round((dToday.getTime() - dTarget.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 1) return timePortion ? `أمس ${timePortion}` : 'أمس';
    if (diffDays === 2) return timePortion ? `قبل أمس ${timePortion}` : 'قبل أمس';
    if (diffDays > 2) return timePortion ? `${targetDateStr.slice(5)} ${timePortion}` : targetDateStr.slice(5);
    return timePortion ? `قادم ${timePortion}` : 'موعد قادم';
  } catch (err) {
    return targetDateStr || 'اليوم';
  }
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

    if (mainContent) {

      mainContent.classList.remove('hidden');

      mainContent.style.display = 'flex';

    }

    initDashboard();

  } else {

    if (overlay) overlay.style.display = 'flex';

    if (mainContent) {

      mainContent.classList.add('hidden');

      mainContent.style.display = 'none';

    }

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

        if (mainContent) {

          mainContent.classList.remove('hidden');

          mainContent.style.display = 'flex';

        }

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

  // Render Cairo Live Prayer Times (12-Hour Format)

  try {

    const prayers = getCairoPrayerTimes();

    const setPt = (id, val) => {

      const el = document.getElementById(id);

      if (el) el.textContent = val;

    };

    const formatPt = (timeStr) => {

      if (!timeStr) return '';

      const [hStr, mStr] = timeStr.split(':');

      let h = parseInt(hStr, 10);

      const m = mStr || '00';

      const suffix = h >= 12 ? 'م' : 'ص';

      h = h % 12;

      if (h === 0) h = 12;

      return `${String(h).padStart(2, '0')}:${m} ${suffix}`;

    };

    if (prayers) {

      setPt('ptFajr', formatPt(prayers.fajr || (prayers.times && prayers.times.fajr)));

      setPt('ptSunrise', formatPt(prayers.sunrise || (prayers.times && prayers.times.sunrise)));

      setPt('ptDhuhr', formatPt(prayers.dhuhr || (prayers.times && prayers.times.dhuhr)));

      setPt('ptAsr', formatPt(prayers.asr || (prayers.times && prayers.times.asr)));

      setPt('ptMaghrib', formatPt(prayers.maghrib || (prayers.times && prayers.times.maghrib)));

      setPt('ptIsha', formatPt(prayers.isha || (prayers.times && prayers.times.isha)));

    }

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

// 🧭 Direct Tab Switcher from Home KPI Cards

window.switchTabDirect = function(tabName) {

  const tabs = document.querySelectorAll('.nav-item');

  const panes = document.querySelectorAll('.tab-pane');

  const titleEl = document.getElementById('currentSectionTitle');

  tabs.forEach(t => {

    if (t.dataset.tab === tabName) {

      t.classList.add('active');

      if (titleEl && t.dataset.title) titleEl.textContent = t.dataset.title;

    } else {

      t.classList.remove('active');

    }

  });

  panes.forEach(p => {

    if (p.id === `tab-${tabName}`) {

      p.classList.add('active');

    } else {

      p.classList.remove('active');

    }

  });

  if (typeof window.toggleMobileSidebar === 'function') {

    window.toggleMobileSidebar(false);

  }

  window.scrollTo({ top: 0, behavior: 'smooth' });

};

// 📅 Current Analytical Time Period State ('today' | 'week' | 'month')

let activeHomePeriod = 'today';

window.setTimePeriodFilter = function(period) {

  activeHomePeriod = period;

  // Update Buttons UI

  const btnToday = document.getElementById('btnFilterToday');

  const btnWeek = document.getElementById('btnFilterWeek');

  const btnMonth = document.getElementById('btnFilterMonth');

  if (btnToday) btnToday.classList.toggle('active', period === 'today');

  if (btnWeek) btnWeek.classList.toggle('active', period === 'week');

  if (btnMonth) btnMonth.classList.toggle('active', period === 'month');

  // Update Period Labels

  const labelText = period === 'today' ? 'اليوم' : (period === 'week' ? 'هذا الأسبوع' : 'هذا الشهر');

  const auditLabel = document.getElementById('auditPeriodLabel');

  const matrixLabel = document.getElementById('matrixPeriodLabel');

  const checklistLabel = document.getElementById('checklistPeriodLabel');

  if (auditLabel) auditLabel.textContent = labelText;

  if (matrixLabel) matrixLabel.textContent = labelText;

  if (checklistLabel) checklistLabel.textContent = labelText;

  // Recalculate

  renderHomeOverview(period);

};

// 🔔 Unified Activity Feed State & Filter Engine (Matching Image 5)

window._cachedAllEvents = [];

window._currentActivityFilter = 'all';

window.filterHomeActivities = function(filterType) {

  window._currentActivityFilter = filterType;

  // Update UI Button active states

  const btnAll = document.getElementById('btnActAll');

  const btnToday = document.getElementById('btnActToday');

  const btnYesterday = document.getElementById('btnActYesterday');

  const btnBefore = document.getElementById('btnActBeforeYesterday');

  const btnFull = document.getElementById('btnActFull');

  if (btnAll) btnAll.classList.toggle('active', filterType === 'all');

  if (btnToday) btnToday.classList.toggle('active', filterType === 'today');

  if (btnYesterday) btnYesterday.classList.toggle('active', filterType === 'yesterday');

  if (btnBefore) btnBefore.classList.toggle('active', filterType === 'before_yesterday');

  if (btnFull) btnFull.classList.toggle('active', filterType === 'all');

  renderHomeActivityTable(filterType);

};

function renderHomeActivityTable(filterType = window._currentActivityFilter || 'all') {
  const tableBody = document.getElementById('homeActivityTableBody');
  if (!tableBody) return;

  const todayStr = getCairoToday();
  const dToday = new Date(todayStr);

  const past1 = new Date(dToday);
  past1.setDate(dToday.getDate() - 1);
  const yesterdayStr = past1.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });

  const past2 = new Date(dToday);
  past2.setDate(dToday.getDate() - 2);
  const beforeYesterdayStr = past2.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });

  let filtered = (window._cachedAllEvents || []).filter(ev => {
    let evDate = ev.dateStr;
    if (!evDate && ev.createdAt) {
      try {
        evDate = new Date(ev.createdAt).toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
      } catch (e) {}
    }

    if (filterType === 'today') return evDate === todayStr;
    if (filterType === 'yesterday') return evDate === yesterdayStr;
    if (filterType === 'before_yesterday') return evDate === beforeYesterdayStr;
    return true; // 'all'
  });

  if (!filtered || filtered.length === 0) {
    let emptyMsg = 'لا توجد نشاطات مسجلة في هذه الفترة.';
    if (filterType === 'today') emptyMsg = 'لا توجد نشاطات مسجلة اليوم حتى الآن. أرسل فويس للبوت لتوثيقها فوراً!';
    else if (filterType === 'yesterday') emptyMsg = 'لا توجد نشاطات مسجلة بالأمس.';
    else if (filterType === 'before_yesterday') emptyMsg = 'لا توجد نشاطات مسجلة قبل أمس.';

    tableBody.innerHTML = `<tr><td colspan="4" class="text-center" style="padding: 16px; color: var(--text-muted); font-size: 0.85rem;">` + emptyMsg + `</td></tr>`;
    return;
  }

  let html = '';
  filtered.forEach(ev => {
    const isNegative = ev.category === 'المالية والخزنة' && (ev.actionType === 'مصروف' || ev.actionType === 'expense');
    const valColor = isNegative ? '#f43f5e' : (ev.valColor || '#10b981');
    const badgeClass = isNegative ? 'badge-expense' : 'badge-income';

    html += `
      <tr>
        <td style="color: #94a3b8; font-size: 0.76rem; font-weight: 700; white-space: nowrap;">${ev.formattedTime}</td>
        <td><b style="color: ${valColor}; font-size: 0.88rem; font-family: var(--font-en); direction: ltr; display: inline-block;">${ev.valOrDuration || '—'}</b></td>
        <td><span style="color: #fff; font-weight: 700; font-size: 0.84rem;">${ev.title}</span></td>
        <td><span class="${badgeClass}">${ev.icon || '📌'} ${ev.actionType || ev.category}</span></td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}

// ─────────────────────────────────────────────────────────────
// 🔐 Multi-Tenant User-Scoped Query Helper & Personalization Engine
// Ensures every DB query and UI element is dynamically tailored
// to the current user's profile and telegram_id
// ─────────────────────────────────────────────────────────────
function getUID() {
  return window.CURRENT_USER_ID || 1191760477;
}

function cleanUserTag(str) {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim();
}

function userMatchesRow(row, uid) {
  if (!row) return false;
  const numUid = Number(uid || 1191760477);
  const tag = `usr:${numUid}`;
  
  if (row.telegram_id && Number(row.telegram_id) === numUid) return true;

  const textFields = [
    row.description, row.content, row.topic, row.surah_name,
    row.workout_type, row.title, row.session_title, row.term_or_sentence,
    row.question, row.notes, row.book_title, row.project_name, row.case_title,
    row.venting_content, row.muscle_groups, row.category, row.ai_therapeutic_feedback,
    row.daily_reflection, row.session_type
  ];
  const hasThisUserTag = textFields.some(t => typeof t === 'string' && t.includes(tag));
  
  if (numUid === 1191760477) {
    const hasAnyUserTag = textFields.some(t => typeof t === 'string' && t.includes('usr:'));
    return hasThisUserTag || !hasAnyUserTag;
  }
  return hasThisUserTag;
}

function cleanRowUserTags(r) {
  if (!r) return r;
  const clean = { ...r };
  [
    'description', 'content', 'topic', 'surah_name', 'workout_type',
    'title', 'session_title', 'term_or_sentence', 'question', 'notes',
    'book_title', 'project_name', 'case_title', 'venting_content',
    'muscle_groups', 'category', 'ai_therapeutic_feedback', 'daily_reflection', 'session_type'
  ].forEach(k => {
    if (typeof clean[k] === 'string') clean[k] = cleanUserTag(clean[k]);
  });
  return clean;
}

function userQuery(tableName) {
  return {
    _tableName: tableName,
    _eqFilters: {},
    _gteFilters: {},
    _orderField: null,
    _orderAsc: false,
    _limitCount: null,
    eq(field, val) {
      this._eqFilters[field] = val;
      return this;
    },
    gte(field, val) {
      this._gteFilters[field] = val;
      return this;
    },
    order(field, { ascending = false } = {}) {
      this._orderField = field;
      this._orderAsc = ascending;
      return this;
    },
    limit(cnt) {
      this._limitCount = cnt;
      return this;
    },
    async maybeSingle() {
      const res = await this;
      return { data: (res.data && res.data.length > 0) ? res.data[0] : null };
    },
    async single() {
      const res = await this;
      return { data: (res.data && res.data.length > 0) ? res.data[0] : null };
    },
    async then(resolve, reject) {
      try {
        const uid = getUID();
        let query = db.from(this._tableName).select('*');
        for (const [f, v] of Object.entries(this._eqFilters)) {
          query = query.eq(f, v);
        }
        for (const [f, v] of Object.entries(this._gteFilters)) {
          query = query.gte(f, v);
        }
        if (this._orderField) {
          query = query.order(this._orderField, { ascending: this._orderAsc });
        }
        
        const { data: rows, error } = await query;
        if (error || !rows) {
          return resolve({ data: [] });
        }
        
        let filtered = rows.filter(r => userMatchesRow(r, uid)).map(cleanRowUserTags);
        if (this._limitCount && this._limitCount > 0) {
          filtered = filtered.slice(0, this._limitCount);
        }
        resolve({ data: filtered });
      } catch (err) {
        resolve({ data: [] });
      }
    }
  };
}

// 👤 Dynamic Identity & Name Personalization

async function applyUserPersonalization() {

  const uid = getUID();

  const sidebarTitle = document.getElementById('sidebarAppTitle');

  const sidebarSubtitle = document.getElementById('sidebarAppSubtitle');

  const welcomeTitle = document.getElementById('homeWelcomeTitle');

  const welcomeDesc = document.getElementById('homeWelcomeDesc');

  const academicBadge = document.getElementById('homeAcademicBadge');

  const adminNav = document.getElementById('nav-item-admin');

  if (uid === 1191760477) {

    // 👑 Admin / Dr. Abdullah

    if (sidebarTitle) sidebarTitle.textContent = 'منظومة د. عبدالله';

    if (sidebarSubtitle) sidebarSubtitle.textContent = 'Abdullah OS • الفرقة 4 • امتياز 450/450 🎯';

    if (welcomeTitle) welcomeTitle.textContent = 'مرحباً بك يا د. عبدالله 🩺✨';

    if (welcomeDesc) welcomeDesc.textContent = 'تقرير "الزتونة" الشامل — رصد تحليلي دقيق لمستوى أدائك اليومي، صعودك وهبوطك، ما أنجزته وما تأخرت فيه، والسيولة النقدية مع توجيه ذكي للحفاظ على شعلة الانضباط.';

    if (academicBadge) academicBadge.textContent = '🎯 الهدف الأكاديمي: امتياز (450/450)';

    if (adminNav) adminNav.style.display = 'flex';

    document.title = "منظومة د. عبدالله | Abdullah's Journey OS";

    return;

  }

  // 🧑‍⚕️ Student / Subscriber (Non-admin)

  if (adminNav) adminNav.style.display = 'none';

  let studentName = window.CURRENT_USER_NAME;
  let university = null;
  let academicYear = 'الفرقة الرابعة';
  let semester = 'الترم الأول';
  let customCourses = [];
  let preferences = { ...DEFAULT_USER_PREFERENCES };

  try {
    const { data: row } = await db.from('bot_sessions').select('*').eq('chat_id', uid).maybeSingle();
    if (row?.data?.profile) {
      studentName = row.data.profile.full_name || studentName;
      university = row.data.profile.university || null;
      academicYear = row.data.profile.academic_year || academicYear;
      semester = row.data.profile.semester || semester;
      customCourses = row.data.profile.custom_courses || customCourses;
      if (row.data.profile.preferences) {
        preferences = { ...preferences, ...row.data.profile.preferences };
      }
    }
  } catch (e) {}

  if (!studentName || !university) {
    try {
      const { data: uRow } = await db.from('users').select('*').eq('telegram_id', uid).maybeSingle();
      if (uRow) {
        studentName = uRow.full_name || studentName;
        university = uRow.university || university;
        academicYear = uRow.academic_year || academicYear;
        semester = uRow.semester || semester;
        customCourses = uRow.custom_courses || customCourses;
        if (uRow.preferences) {
          preferences = { ...preferences, ...uRow.preferences };
        }
      }
    } catch (e) {}
  }

  if (!studentName && window.Telegram?.WebApp?.initDataUnsafe?.user) {
    const u = window.Telegram.WebApp.initDataUnsafe.user;
    studentName = [u.first_name, u.last_name].filter(Boolean).join(' ');
  }

  // Calculate active courses for this user
  const presetList = (PRESET_COURSES_BY_YEAR[academicYear] && PRESET_COURSES_BY_YEAR[academicYear][semester])
    || PRESET_COURSES_BY_YEAR['الفرقة الرابعة']['الترم الأول'];
  if (Array.isArray(customCourses) && customCourses.length > 0) {
    window.USER_ACTIVE_COURSES = customCourses;
  } else {
    window.USER_ACTIVE_COURSES = presetList;
  }
  window.USER_PREFERENCES = preferences;

  // Apply visibility to sidebar tabs dynamically
  const setTabVis = (tabName, isVisible) => {
    const btn = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
    if (btn) btn.style.display = isVisible ? 'flex' : 'none';
  };

  setTabVis('english', preferences.english !== false);
  setTabVis('quran', preferences.islamic !== false);
  setTabVis('fasting', preferences.islamic !== false);
  setTabVis('wellness', preferences.wellness !== false);
  setTabVis('gym', preferences.gym === true);
  setTabVis('content', preferences.content === true);
  setTabVis('work', preferences.work === true);
  setTabVis('finance', preferences.finance !== false);

  if (studentName) {
    const cleanName = studentName.trim();
    const displayName = (cleanName.startsWith('د.') || cleanName.startsWith('د/')) ? cleanName : `د. ${cleanName}`;

    if (sidebarTitle) sidebarTitle.textContent = `منظومة ${displayName}`;
    if (sidebarSubtitle) sidebarSubtitle.textContent = university ? `${university} • ${academicYear} (${semester}) 🎯` : `${academicYear} (${semester}) • المنظومة الذكية 🎯`;
    if (welcomeTitle) welcomeTitle.textContent = `مرحباً بك يا ${displayName} 🩺✨`;
    if (welcomeDesc) welcomeDesc.textContent = `تقريرك الشامل — رصد تحليلي دقيق لمستوى أدائك اليومي وسجل موديولاتك النشطة لـ ${academicYear} (${semester}).`;
    if (academicBadge) academicBadge.textContent = `🎯 الهدف الأكاديمي: امتياز في ${academicYear}`;
    document.title = `منظومة ${displayName} | المنظومة الطبية الذكية`;
  } else {
    if (sidebarTitle) sidebarTitle.textContent = 'المنظومة الطبية الذكية';
    if (sidebarSubtitle) sidebarSubtitle.textContent = 'Smart Medical Life OS 🎯';
    if (welcomeTitle) welcomeTitle.textContent = 'مرحباً بك في المنظومة الذكية 🩺✨';
    if (welcomeDesc) welcomeDesc.textContent = 'تقريرك الشامل — رصد تحليلي دقيق لمستوى أدائك اليومي وسجل إنجازاتك الدراسية.';
    if (academicBadge) academicBadge.textContent = '🎯 الهدف الأكاديمي: امتياز وتفوق مستمر';
    document.title = 'المنظومة الطبية الذكية | Smart Medical OS';
  }

}

window.applyUserPersonalization = applyUserPersonalization;

// 🏠 0. Executive Home Overview & Strategic AI Performance Audit

async function renderHomeOverview(period = activeHomePeriod) {

  try {

    const uid = getUID();

    const todayStr = getCairoToday();

    const now = new Date();

    // Determine Date Filter Threshold

    let dateFilterStart = todayStr;

    if (period === 'week') {

      const past7 = new Date();

      past7.setDate(now.getDate() - 7);

      dateFilterStart = past7.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });

    } else if (period === 'month') {

      const past30 = new Date();

      past30.setDate(now.getDate() - 30);

      dateFilterStart = past30.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });

    }

    // 1. Study Sessions in Period

    let studyQuery = userQuery('study_sessions');

    if (period === 'today') {

      studyQuery = studyQuery.eq('date', todayStr);

    } else {

      studyQuery = studyQuery.gte('date', dateFilterStart);

    }

    const { data: studyRows } = await studyQuery;

    let totalStudyMins = 0;

    let totalPages = 0;

    (studyRows || []).forEach(s => {

      totalStudyMins += (Number(s.duration_minutes) || 0);

      totalPages += (Number(s.pages_studied) || 0);

    });

    const studyHours = (totalStudyMins / 60).toFixed(1);

    const targetStudyHours = period === 'today' ? 3 : (period === 'week' ? 21 : 90);

    // Update Home Top KPI Card 1

    const homeKpiStudyHoursEl = document.getElementById('homeKpiStudyHours');

    const homeKpiStudySubEl = document.getElementById('homeKpiStudySub');

    if (homeKpiStudyHoursEl) homeKpiStudyHoursEl.innerHTML = `${studyHours} <span class="kpi-unit">ساعة</span>`;

    if (homeKpiStudySubEl) homeKpiStudySubEl.textContent = `الهدف: ${targetStudyHours} ساعات`;

    // 2. Medical Spaced Quizzes & Due Overdue Backlog

    const { data: medQuizzes } = await userQuery('medical_spaced_quizzes');

    const totalMedCount = medQuizzes?.length || 0;

    let medDueCount = 0;

    const nowIso = new Date().toISOString();

    (medQuizzes || []).forEach(q => {

      if (!q.next_review_at || q.next_review_at <= nowIso) {

        medDueCount++;

      }

    });

    // 3. English Spaced Flashcards & Due Backlog

    const { data: engCards } = await userQuery('english_spaced_flashcards');

    const totalEngCount = engCards?.length || 0;

    let engDueCount = 0;

    (engCards || []).forEach(c => {

      if (!c.next_review_at || c.next_review_at <= nowIso) {

        engDueCount++;

      }

    });

    // Update Home Top KPI Card 4

    const homeKpiEngCardsEl = document.getElementById('homeKpiEngCards');

    const homeKpiEngSubEl = document.getElementById('homeKpiEngSub');

    if (homeKpiEngCardsEl) homeKpiEngCardsEl.innerHTML = `${totalEngCount} <span class="kpi-unit">كلمة</span>`;

    if (homeKpiEngSubEl) homeKpiEngSubEl.textContent = engDueCount > 0 ? `${engDueCount} مستحق للمراجعة` : `تكرار متباعد ذكي`;

    // 4. Quran Sessions in Period

    let quranQuery = userQuery('quran_logs');

    if (period === 'today') quranQuery = quranQuery.eq('date', todayStr);

    else quranQuery = quranQuery.gte('date', dateFilterStart);

    const { data: quranRows } = await quranQuery;

    let totalQuranMins = 0;

    let totalQuranPages = 0;

    (quranRows || []).forEach(q => {

      totalQuranMins += (Number(q.duration_minutes) || 0);

      totalQuranPages += (Number(q.pages_count) || 0);

    });

    // Update Home Top KPI Card 2

    const homeKpiQuranPagesEl = document.getElementById('homeKpiQuranPages');

    const homeKpiQuranSubEl = document.getElementById('homeKpiQuranSub');

    if (homeKpiQuranPagesEl) homeKpiQuranPagesEl.innerHTML = `${totalQuranPages || totalQuranMins || 0} <span class="kpi-unit">${totalQuranPages > 0 ? 'صفحة' : 'دقيقة'}</span>`;

    if (homeKpiQuranSubEl) homeKpiQuranSubEl.textContent = `${quranRows?.length || 0} جلسات مسجلة`;

    // 5. Fasting and Worship in Period

    let fastQuery = userQuery('fasting_and_worship_logs');

    if (period === 'today') fastQuery = fastQuery.eq('date', todayStr);

    else fastQuery = fastQuery.gte('date', dateFilterStart);

    const { data: fastRows } = await fastQuery;

    let fastDoneCount = 0;

    let adhkarFajrDone = false;

    let adhkarAsrDone = false;

    (fastRows || []).forEach(f => {

      if (f.fasting_completed) fastDoneCount++;

      if (f.morning_adhkar) adhkarFajrDone = true;

      if (f.evening_adhkar) adhkarAsrDone = true;

    });

    // 6. Gym Sessions in Period

    let gymQuery = userQuery('fitness_gym_logs');

    if (period === 'today') gymQuery = gymQuery.eq('date', todayStr);

    else gymQuery = gymQuery.gte('date', dateFilterStart);

    const { data: gymRows } = await gymQuery;

    const gymSessionsCount = gymRows?.length || 0;

    let totalGymMins = 0;

    (gymRows || []).forEach(g => {

      totalGymMins += (Number(g.duration_minutes) || 45);

    });

    // Update Home Top KPI Card 3

    const homeKpiGymMinsEl = document.getElementById('homeKpiGymMins');

    const homeKpiGymSubEl = document.getElementById('homeKpiGymSub');

    if (homeKpiGymMinsEl) homeKpiGymMinsEl.innerHTML = `${totalGymMins || (gymSessionsCount * 45)} <span class="kpi-unit">دقيقة</span>`;

    if (homeKpiGymSubEl) homeKpiGymSubEl.textContent = `${gymSessionsCount} تمارين مسجلة`;

    // 7. Content Creation in Period

    let contentQuery = userQuery('content_creation');

    if (period === 'today') contentQuery = contentQuery.eq('date', todayStr);

    else contentQuery = contentQuery.gte('date', dateFilterStart);

    const { data: contentRows } = await contentQuery;

    // 8. Business & Work Projects in Period

    const { data: projRows } = await userQuery('work_projects');

    // 9. Financial Expenses & Health in Period

    let finQuery = userQuery('personal_finance');

    if (period === 'today') finQuery = finQuery.eq('date', todayStr);

    else finQuery = finQuery.gte('date', dateFilterStart);

    const { data: finRows } = await finQuery;

    let periodExpenses = 0;

    let periodIncome = 0;

    (finRows || []).forEach(tr => {

      const amt = Number(tr.amount) || 0;

      if (tr.type === 'expense' || tr.type === 'مصروف') periodExpenses += amt;

      else if (tr.type === 'income' || tr.type === 'دخل' || tr.type === 'إيراد') periodIncome += amt;

    });

    const { data: sessLiq } = await db.from('bot_sessions').select('*').eq('chat_id', getUID()).maybeSingle();

    const liqObj = sessLiq?.data?.liquidity || {};

    let totalBal = (Number(liqObj['خزنة شخصية'] || 0) + Number(liqObj['فودافون كاش'] || 0) + Number(liqObj['إنستا باي'] || 0) + Number(liqObj['بنك مصر'] || 0));

    // Update Home Top KPI Card 5

    const homeKpiTotalLiquidityEl = document.getElementById('homeKpiTotalLiquidity');

    const homeKpiLiquiditySubEl = document.getElementById('homeKpiLiquiditySub');

    if (homeKpiTotalLiquidityEl) homeKpiTotalLiquidityEl.innerHTML = `${totalBal.toLocaleString('en-US', { minimumFractionDigits: 0 })} <span class="kpi-unit">ج.م</span>`;

    if (homeKpiLiquiditySubEl) homeKpiLiquiditySubEl.textContent = `خزنة • بنك • محافظ`;

    // 10. Daily Non-Negotiable Checklist Evaluation

    const checkStudy = Number(studyHours) >= (period === 'today' ? 3 : (period === 'week' ? 21 : 90));

    const checkGym = gymSessionsCount >= (period === 'today' ? 1 : (period === 'week' ? 5 : 20));

    const checkQuran = totalQuranMins >= (period === 'today' ? 30 : (period === 'week' ? 210 : 900)) || (quranRows && quranRows.length > 0);

    const checkEnglish = totalEngCount > 0;

    const checkFajrAdhkar = adhkarFajrDone;

    const checkAsrAdhkar = adhkarAsrDone;

    const checklistItems = [

      { title: 'مذاكرة الطب والسكاشن (3 ساعات)', done: checkStudy, meta: `${studyHours} / ${targetStudyHours} ساعة`, icon: '⏱️' },

      { title: 'تمرين الجيم والقوة البدنية', done: checkGym, meta: `${gymSessionsCount} تمارين مسجلة`, icon: '🏋️‍♂️' },

      { title: 'ورد القرآن الكريم (30 دقيقة)', done: checkQuran, meta: `${totalQuranMins} دقيقة ورد`, icon: '📖' },

      { title: 'تطوير اللغة الإنجليزية والـ Anki', done: checkEnglish, meta: `${totalEngCount} كلمات مبرمجة`, icon: '🗣️' },

      { title: 'أذكار وسكينة الفجر (ساعة كاملة)', done: checkFajrAdhkar, meta: checkFajrAdhkar ? 'تم التوثيق' : 'بانتظار الذكر', icon: '🌅' },

      { title: 'أذكار وتدبر العصر (ساعة كاملة)', done: checkAsrAdhkar, meta: checkAsrAdhkar ? 'تم التوثيق' : 'بانتظار الذكر', icon: '🌇' }

    ];

    let doneChecksCount = 0;

    let checklistHtml = '';

    checklistItems.forEach(item => {

      if (item.done) doneChecksCount++;

      checklistHtml += `

        <div class="check-item" style="border-right: 4px solid ${item.done ? 'var(--accent-primary)' : 'var(--border-card)'};">

          <div class="check-item-info">

            <span style="font-size: 1.3rem;">${item.icon}</span>

            <div>

              <div class="check-item-title">${item.title}</div>

              <div class="check-item-meta">${item.meta}</div>

            </div>

          </div>

          <span class="task-status-badge ${item.done ? 'status-done' : 'status-pending'}">

            ${item.done ? '✅ مكتمل' : '⏳ بانتظار الإنجاز'}

          </span>

        </div>

      `;

    });

    const checklistGrid = document.getElementById('homeChecklistGrid');

    if (checklistGrid) checklistGrid.innerHTML = checklistHtml;

    const checklistBadge = document.getElementById('checklistDoneBadge');

    if (checklistBadge) checklistBadge.textContent = `${doneChecksCount} / ${checklistItems.length} مكتمل`;

    // 11. Calculate Overall Strategic Score & Momentum

    const scorePct = Math.round((doneChecksCount / checklistItems.length) * 100);

    const scoreNumEl = document.getElementById('overallScoreNum');

    const scoreDescEl = document.getElementById('overallScoreDesc');

    const scoreBadgeEl = document.getElementById('overallScoreBadge');

    if (scoreNumEl) scoreNumEl.textContent = `${scorePct}%`;

    if (scoreDescEl) {

      if (scorePct >= 80) {

        scoreDescEl.textContent = 'أداء ممتاز واستثنائي 🟢';

        if (scoreBadgeEl) {

          scoreBadgeEl.style.borderColor = 'rgba(16, 185, 129, 0.5)';

          scoreBadgeEl.style.background = 'rgba(16, 185, 129, 0.12)';

        }

      } else if (scorePct >= 50) {

        scoreDescEl.textContent = 'أداء متوسط — يحتاج تعزيز 🟡';

        if (scoreBadgeEl) {

          scoreBadgeEl.style.borderColor = 'rgba(245, 158, 11, 0.5)';

          scoreBadgeEl.style.background = 'rgba(245, 158, 11, 0.12)';

        }

      } else {

        scoreDescEl.textContent = 'تراجع يتطلب تدخلاً وانضباطاً 🔴';

        if (scoreBadgeEl) {

          scoreBadgeEl.style.borderColor = 'rgba(244, 63, 94, 0.5)';

          scoreBadgeEl.style.background = 'rgba(244, 63, 94, 0.12)';

        }

      }

    }

    // 12. Synthesize AI Audit Diagnostics

    const strengthsEl = document.getElementById('auditStrengthsList');

    const strengths = [];

    if (checkStudy) strengths.push(`📚 إنجاز المذاكرة المستهدفة (${studyHours} ساعة)`);

    if (checkQuran) strengths.push(`📖 انتظام تام في ورد القرآن الكريم (${totalQuranMins} دقيقة)`);

    if (checkGym) strengths.push(`🏋️‍♂️ الالتزام بنشاط وتمرين الجيم (${gymSessionsCount} تمارين)`);

    if (checkEnglish) strengths.push(`🗣️ الاستمرار في حفظ ومراجعة الإنجليزية (${totalEngCount} كلمات)`);

    if (checkFajrAdhkar) strengths.push(`🌅 المحافظة على أذكار وسكينة الفجر`);

    if (checkAsrAdhkar) strengths.push(`🌇 أذكار المساء وتفريغ المشاعر مكتملة`);

    if (strengths.length === 0) strengths.push(`🚀 جاهز للبدء وتحقيق أولى ثوابت ${period === 'today' ? 'اليوم' : 'الفترة'}`);

    if (strengthsEl) {

      strengthsEl.innerHTML = strengths.map(s => `<div class="audit-bullet">🔥 ${s}</div>`).join('');

    }

    // ⚠️ Slipping Areas & Gaps

    const slippingEl = document.getElementById('auditSlippingList');

    const slippings = [];

    if (!checkStudy) {

      const remaining = Math.max(0, targetStudyHours - Number(studyHours)).toFixed(1);

      slippings.push(`ساعات المذاكرة ناقصة: متبقي <b>${remaining} ساعة</b> للهدف.`);

    }

    if (!checkQuran) slippings.push(`لم يتم توثيق ورد القرآن الكريم (30 دقيقة مطلوبة).`);

    if (!checkGym && period !== 'today') slippings.push(`أيام الجيم أقل من المستهدف لهذا الأسبوع.`);

    if (!checkEnglish) slippings.push(`لم يتم فتح وممارسة فلاش كاردز الإنجليزية.`);

    if (!checkFajrAdhkar && period === 'today') slippings.push(`أذكار الفجر لم توثق بعد.`);

    if (!checkAsrAdhkar && period === 'today') slippings.push(`أذكار العصر لم توثق بعد.`);

    if (slippings.length === 0) slippings.push(`🌟 لا توجد أي نواقص! أنت في قمة الالتزام والانضباط الكامل.`);

    if (slippingEl) {

      slippingEl.innerHTML = slippings.map(s => `<div class="audit-bullet">⚠️ ${s}</div>`).join('');

    }

    // ⏳ Overdue Backlog

    const backlogEl = document.getElementById('auditBacklogList');

    const backlogs = [];

    if (medDueCount > 0) backlogs.push(`🩺 <b>${medDueCount}</b> كويزات طبية مستحقة للمراجعة الآن.`);

    if (engDueCount > 0) backlogs.push(`🗣️ <b>${engDueCount}</b> فلاش كارد إنجليزية مستحقة للتثبيت.`);

    if (backlogs.length === 0) backlogs.push(`✅ لا توجد متأخرات مراجعة معلقة.`);

    if (backlogEl) {

      backlogEl.innerHTML = backlogs.map(b => `<div class="audit-bullet">${b}</div>`).join('');

    }

    // 💵 Financial Health Report

    const financeReportEl = document.getElementById('auditFinanceReport');

    let finMessage = '';

    const expenseThreshold = period === 'today' ? 300 : (period === 'week' ? 1500 : 6000);

    if (periodExpenses > expenseThreshold) {

      finMessage = `⚠️ <b>تنبيه ميزانية:</b> مصروفاتك في ${period === 'today' ? 'اليوم' : (period === 'week' ? 'الأسبوع' : 'الشهر')} مرتفعة (<b>${periodExpenses.toLocaleString('en-US')} ج.م</b>). يُنصح بضبط النفقات غير الضرورية.`;

    } else if (periodExpenses > 0) {

      finMessage = `💳 <b>وضع مالي متزن:</b> مصروفات الفترة (<b>${periodExpenses.toLocaleString('en-US')} ج.م</b>) معتدلة وفي حدود الميزانية الطبيعية.`;

    } else {

      finMessage = `🟢 لم يتم تسجيل أي مصروفات حتى الآن في هذه الفترة. الرصيد محفوظ بالكامل.`;

    }

    if (financeReportEl) {

      financeReportEl.innerHTML = `<div class="audit-bullet">${finMessage}</div>`;

    }

    // 💡 Motivational Message Generation

    const motivTextEl = document.getElementById('auditMotivText');

    if (motivTextEl) {

      if (scorePct >= 80) {

        motivTextEl.textContent = '🌟 "أداء استثنائي وعزيمة حديدية يا دكتور عبد الله! استمر بنفس القوة والإصرار." 🩺🔥';

      } else if (scorePct >= 50) {

        motivTextEl.textContent = '⚡ "بداية طيبة، لكنك قادر على مضاعفة إنجازك اليوم.. انطلق وحقق أهدافك!" 💪';

      } else {

        motivTextEl.textContent = '🔥 "حين يخفت الشغف يتقدم الانضباط ليصنع الفارق.. لا تنتظر المزاج أو الحماس، ابدأ أول خطوة الآن واصنع مجدك بيدك!" 🩺';

      }

    }

    // 14. Expense Categorization Breakdown

    let catMed = 0;

    let catGym = 0;

    let catTransport = 0;

    let catBusiness = 0;

    (finRows || []).forEach(tr => {

      if (tr.type === 'expense' || tr.type === 'مصروف') {

        const cat = (tr.category || '').toLowerCase();

        const amt = Number(tr.amount) || 0;

        if (cat.includes('طب') || cat.includes('دراس') || cat.includes('كتب') || cat.includes('medical') || cat.includes('study')) {

          catMed += amt;

        } else if (cat.includes('جيم') || cat.includes('تغذ') || cat.includes('gym') || cat.includes('food') || cat.includes('diet')) {

          catGym += amt;

        } else if (cat.includes('مواصل') || cat.includes('بنزين') || cat.includes('نقل') || cat.includes('uber') || cat.includes('transport')) {

          catTransport += amt;

        } else {

          catBusiness += amt;

        }

      }

    });

    const expMedEl = document.getElementById('expCatMedical');

    const expGymEl = document.getElementById('expCatGym');

    const expTransEl = document.getElementById('expCatTransport');

    const expBizEl = document.getElementById('expCatBusiness');

    if (expMedEl) expMedEl.textContent = `${catMed.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م`;

    if (expGymEl) expGymEl.textContent = `${catGym.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م`;

    if (expTransEl) expTransEl.textContent = `${catTransport.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م`;

    if (expBizEl) expBizEl.textContent = `${catBusiness.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م`;

    // 15. Master Unified Realtime Activity Ledger & Table (سجل النشاطات والعمليات الأخيرة)

    try {

      const [

        { data: recentStudy },

        { data: recentFinance },

        { data: recentQuran },

        { data: recentGym },

        { data: recentEnglish },

        { data: recentTasks },

        { data: recentAppts },

        { data: recentWellness },

        { data: recentWork },

        { data: recentContent },

        { data: recentThoughts },

        { data: recentAttendance }

      ] = await Promise.all([

        userQuery('study_sessions').order('created_at', { ascending: false }).limit(10),

        userQuery('personal_finance').order('created_at', { ascending: false }).limit(10),

        userQuery('quran_logs').order('created_at', { ascending: false }).limit(10),

        userQuery('fitness_gym_logs').order('created_at', { ascending: false }).limit(8),

        userQuery('english_spaced_flashcards').order('created_at', { ascending: false }).limit(8),

        userQuery('daily_tasks').order('created_at', { ascending: false }).limit(8),

        userQuery('appointments_and_reminders').order('created_at', { ascending: false }).limit(6),

        userQuery('mental_wellness_logs').order('created_at', { ascending: false }).limit(6),

        userQuery('work_projects').order('created_at', { ascending: false }).limit(6),

        userQuery('content_creation').order('created_at', { ascending: false }).limit(6),

        userQuery('thoughts_and_wisdom').order('created_at', { ascending: false }).limit(6),

        userQuery('attendance_logs').order('created_at', { ascending: false }).limit(6)

      ]);

      const allEvents = [];

      (recentStudy || []).forEach(s => {

        const durMins = Number(s.duration_minutes || 0);

        const durText = durMins >= 60 ? `${(durMins / 60).toFixed(1).replace('.0', '')} ${durMins === 60 ? 'ساعة' : durMins === 120 ? 'ساعتين' : durMins >= 180 && durMins <= 600 ? 'ساعات' : 'ساعة'}` : `${durMins} دقيقة`;

        allEvents.push({

          icon: '🩺',

          category: 'الطب والسكاشن',

          catBg: 'rgba(16, 185, 129, 0.15)',

          catColor: 'var(--accent-primary)',

          catBorder: 'rgba(16, 185, 129, 0.35)',

          actionType: 'مذاكرة طبية',

          title: `[${s.course_code || 'CAD402'}] ${s.topic || 'جلسة مذاكرة'}`,

          subtext: `${s.pages_covered ? `📄 <b>${s.pages_covered} صفحة</b> | ` : ''}${s.comprehension_rating ? `🧠 استيعاب: ${'⭐'.repeat(s.comprehension_rating)}` : 'جلسة تحصيل إكلينيكي'}`,

          valOrDuration: durText,

          valColor: 'var(--accent-primary)',

          dateStr: s.date,

          createdAt: s.created_at,

          formattedTime: formatRelativeDate(s.date, s.created_at)

        });

      });

      (recentFinance || []).forEach(f => {

        const isIncome = f.type === 'دخل' || f.type === 'إيراد' || f.type === 'income';

        allEvents.push({

          icon: isIncome ? '💰' : '💵',

          category: 'المالية والخزنة',

          catBg: isIncome ? 'rgba(74, 222, 128, 0.12)' : 'rgba(244, 63, 94, 0.12)',

          catColor: isIncome ? '#4ade80' : '#f43f5e',

          catBorder: isIncome ? 'rgba(74, 222, 128, 0.3)' : 'rgba(244, 63, 94, 0.3)',

          actionType: isIncome ? 'إيراد مالي' : 'مصروف شخصي',

          title: `${f.description || f.category || 'حركة مالية'}`,

          subtext: `💳 الخزنة: <b>${f.payment_method || 'خزنة شخصية'}</b> | 🏷️ البند: ${f.category || 'عام'}`,

          valOrDuration: `${formatEgp(f.amount)}`,

          valColor: isIncome ? '#4ade80' : '#f43f5e',

          dateStr: f.date,

          createdAt: f.created_at,

          formattedTime: formatRelativeDate(f.date, f.created_at)

        });

      });

      (recentQuran || []).forEach(q => {

        allEvents.push({

          icon: '📖',

          category: 'القرآن الكريم',

          catBg: 'rgba(16, 185, 129, 0.15)',

          catColor: '#10b981',

          catBorder: 'rgba(16, 185, 129, 0.35)',

          actionType: 'تلاوة وتثبيت',

          title: `سورة ${q.surah_name || 'الورد اليومي'}`,

          subtext: `نوع الورد: ${q.session_type || 'مراجعة وتثبيت'}${q.quality_rating ? ` | ⭐ الإتقان: ${q.quality_rating}/5` : ''}`,

          valOrDuration: `${q.pages_count || 1} صفحة`,

          valColor: '#10b981',

          dateStr: q.date,

          createdAt: q.created_at,

          formattedTime: formatRelativeDate(q.date, q.created_at)

        });

      });

      (recentGym || []).forEach(g => {

        allEvents.push({

          icon: '🏋️‍♂️',

          category: 'الجيم واللياقة',

          catBg: 'rgba(56, 189, 248, 0.12)',

          catColor: '#38bdf8',

          catBorder: 'rgba(56, 189, 248, 0.3)',

          actionType: 'تمرين لياقة',

          title: `تمرين: ${g.workout_type || 'حديد ومقاومة'}`,

          subtext: `${g.muscle_groups ? `💪 العضلات المستهدفة: <b>${g.muscle_groups}</b>` : 'تمارين بدنية وقوة'}`,

          valOrDuration: `${g.duration_minutes || 45} دقيقة`,

          valColor: '#38bdf8',

          dateStr: g.date,

          createdAt: g.created_at,

          formattedTime: formatRelativeDate(g.date, g.created_at)

        });

      });

      (recentEnglish || []).forEach(c => {

        allEvents.push({

          icon: '🗣️',

          category: 'الإنجليزية (Anki)',

          catBg: 'rgba(245, 158, 11, 0.12)',

          catColor: 'var(--accent-gold)',

          catBorder: 'rgba(245, 158, 11, 0.3)',

          actionType: 'فلاش كارد',

          title: `"${c.term_or_sentence || ''}"`,

          subtext: `💡 ${c.egyptian_translation || ''}${c.example_sentence ? ` | 📝 <i>"${c.example_sentence}"</i>` : ''}`,

          valOrDuration: `مستوى ${c.repetitions_count || 1}`,

          valColor: 'var(--accent-gold)',

          dateStr: null,

          createdAt: c.created_at,

          formattedTime: formatRelativeDate(null, c.created_at)

        });

      });

      (recentTasks || []).forEach(t => {

        allEvents.push({

          icon: '🎯',

          category: 'المهام والمواعيد',

          catBg: 'rgba(168, 85, 247, 0.12)',

          catColor: '#c084fc',

          catBorder: 'rgba(168, 85, 247, 0.3)',

          actionType: 'مهمة يومية',

          title: `${t.title}`,

          subtext: `📌 الحالة: <b>${t.status || 'معلق'}</b> | 🏷️ التصنيف: ${t.category || 'عام'}`,

          valOrDuration: t.status === 'تم الإنجاز' ? '✅ منجز' : '⏳ معلق',

          valColor: t.status === 'تم الإنجاز' ? 'var(--accent-primary)' : 'var(--accent-gold)',

          dateStr: t.date,

          createdAt: t.created_at,

          formattedTime: formatRelativeDate(t.date, t.created_at)

        });

      });

      (recentAppts || []).forEach(a => {

        allEvents.push({

          icon: '⏰',

          category: 'المواعيد والتنبيهات',

          catBg: 'rgba(168, 85, 247, 0.12)',

          catColor: '#c084fc',

          catBorder: 'rgba(168, 85, 247, 0.3)',

          actionType: 'موعد مجدول',

          title: `${a.title}`,

          subtext: `${a.notes ? `📝 ${a.notes}` : 'تنبيه مجدول'}`,

          valOrDuration: '⏰ موعد',

          valColor: '#c084fc',

          dateStr: a.date,

          createdAt: a.due_datetime || a.created_at,

          formattedTime: formatRelativeDate(a.date, a.due_datetime || a.created_at)

        });

      });

      (recentWellness || []).forEach(w => {

        allEvents.push({

          icon: '🧠',

          category: 'الفضفضة والاتزان',

          catBg: 'rgba(56, 189, 248, 0.12)',

          catColor: '#38bdf8',

          catBorder: 'rgba(56, 189, 248, 0.3)',

          actionType: 'فضفضة وتفريغ',

          title: `فضفضة: "${(w.venting_content || w.emotional_state || '').slice(0, 45)}..."`,

          subtext: `💭 المشاعر: <b>${w.emotional_state || 'تفريغ'}</b> | ⭐ المزاج: ${w.mood_rating || 4}/5`,

          valOrDuration: `${w.mood_rating || 4}/5 مزاج`,

          valColor: '#38bdf8',

          dateStr: w.date,

          createdAt: w.created_at,

          formattedTime: formatRelativeDate(w.date, w.created_at)

        });

      });

      (recentWork || []).forEach(w => {

        allEvents.push({

          icon: '💼',

          category: 'الشغل والبيزنس',

          catBg: 'rgba(168, 85, 247, 0.12)',

          catColor: '#a855f7',

          catBorder: 'rgba(168, 85, 247, 0.3)',

          actionType: 'مشروع عمل',

          title: `[${w.project_name}] ${w.task_description}`,

          subtext: `📌 الحالة: <b>${w.status || 'قيد التنفيذ'}</b>`,

          valOrDuration: w.revenue_generated ? formatEgp(w.revenue_generated) : '💼 مشروع',

          valColor: w.revenue_generated ? '#4ade80' : '#a855f7',

          dateStr: w.date,

          createdAt: w.created_at,

          formattedTime: formatRelativeDate(w.date, w.created_at)

        });

      });

      (recentContent || []).forEach(c => {

        allEvents.push({

          icon: '🎬',

          category: 'صناعة المحتوى',

          catBg: 'rgba(244, 63, 94, 0.12)',

          catColor: '#f43f5e',

          catBorder: 'rgba(244, 63, 94, 0.3)',

          actionType: 'فيديو وميديا',

          title: `[${c.platform}] ${c.title}`,

          subtext: `📌 المرحلة: <b>${c.stage || 'فكرة'}</b>`,

          valOrDuration: `${c.platform || 'ميديا'}`,

          valColor: '#f43f5e',

          dateStr: c.date,

          createdAt: c.created_at,

          formattedTime: formatRelativeDate(c.date, c.created_at)

        });

      });

      (recentThoughts || []).forEach(th => {

        allEvents.push({

          icon: '💡',

          category: 'بنك الخواطر',

          catBg: 'rgba(245, 158, 11, 0.12)',

          catColor: 'var(--accent-gold)',

          catBorder: 'rgba(245, 158, 11, 0.3)',

          actionType: 'خاطرة وفكرة',

          title: `خاطرة: "${th.content.slice(0, 50)}..."`,

          subtext: `🏷️ التصنيف: <b>${th.category || 'انضباط'}</b>`,

          valOrDuration: '💡 حكمة',

          valColor: 'var(--accent-gold)',

          dateStr: th.date,

          createdAt: th.created_at,

          formattedTime: formatRelativeDate(th.date, th.created_at)

        });

      });

      (recentAttendance || []).forEach(a => {

        allEvents.push({

          icon: '📝',

          category: 'الطب والسكاشن',

          catBg: 'rgba(16, 185, 129, 0.15)',

          catColor: 'var(--accent-primary)',

          catBorder: 'rgba(16, 185, 129, 0.35)',

          actionType: 'حضور راوند',

          title: `[${a.course_code}] ${a.session_title}`,

          subtext: `📌 الحالة: <b>${a.status}</b>${a.reason ? ` | السبب: ${a.reason}` : ''}`,

          valOrDuration: a.status === 'حضور' ? '✅ حاضر' : '❌ غياب',

          valColor: a.status === 'حضور' ? 'var(--accent-primary)' : '#f43f5e',

          dateStr: a.date,

          createdAt: a.created_at,

          formattedTime: formatRelativeDate(a.date, a.created_at)

        });

      });

      // Sort all events by timestamp descending (newest first)

      allEvents.sort((a, b) => {

        const tA = new Date(a.createdAt || a.dateStr || 0).getTime();

        const tB = new Date(b.createdAt || b.dateStr || 0).getTime();

        return tB - tA;

      });

      window._cachedAllEvents = allEvents;

      renderHomeActivityTable(window._currentActivityFilter || 'all');

    } catch (actErr) {

      console.warn('homeRecentActivities error:', actErr);

    }

    // Dynamic Modules Tracker on Home
    const homeModulesContainer = document.getElementById('homeModulesProgressGrid');
    if (homeModulesContainer) {
      const { data: allStudyRows } = await userQuery('study_sessions');

      const activeCourses = window.USER_ACTIVE_COURSES || [
        { code: 'PED401', title: 'Pediatric 1 (طب الأطفال 1)' },
        { code: 'CAD402', title: 'Cardiac Disorders (أمراض القلب)' },
        { code: 'RSD403', title: 'Respiratory Disorders (أمراض الصدر)' },
        { code: 'HVD404', title: 'Hematological Disorders (أمراض الدم)' },
        { code: 'SKL 7', title: 'Clinical Skills 7 (المهارات الإكلينيكية)' }
      ];

      const moduleStats = {};
      activeCourses.forEach(c => {
        const code = c.code.toUpperCase();
        moduleStats[code] = {
          name: c.title,
          icon: getCourseIcon(c.title, c.code),
          hours: 0,
          mins: 0,
          credits: 5,
          count: 0,
          lastTopic: '',
          lastDate: ''
        };
      });

      (allStudyRows || []).forEach(s => {
        const code = (s.course_code || 'MOD').trim().toUpperCase();
        if (!moduleStats[code]) {
          moduleStats[code] = {
            name: s.topic || `موديول [${code}]`,
            icon: getCourseIcon(s.topic || '', code),
            hours: 0,
            mins: 0,
            credits: 5,
            count: 0,
            lastTopic: '',
            lastDate: ''
          };
        }
        const mins = Number(s.duration_minutes || 0);
        moduleStats[code].hours += mins / 60;
        moduleStats[code].mins += mins;
        moduleStats[code].count++;
        if (!moduleStats[code].lastTopic || (s.date && s.date >= moduleStats[code].lastDate)) {
          moduleStats[code].lastTopic = s.topic || 'مذاكرة';
          moduleStats[code].lastDate = s.date || '';
        }
      });

      let modHtml = '';

      Object.entries(moduleStats).forEach(([code, data]) => {

        const hrsFormatted = data.hours > 0 ? (data.hours % 1 === 0 ? data.hours.toFixed(0) : data.hours.toFixed(1)) : '0.0';

        modHtml += `

          <div class="module-progress-card" onclick="switchTabDirect('medical')">

            <div class="module-progress-header">

              <span class="module-code-badge">${code}</span>

              <span class="task-status-badge ${data.count > 0 ? 'status-done' : 'status-pending'}">${data.count > 0 ? `${data.count} جلسات` : 'بانتظار البدء'}</span>

            </div>

            <div class="module-name-title">${data.icon} ${data.name}</div>

            <div class="module-stats-row">

              <div class="module-study-hours-val">${hrsFormatted} <span>ساعة مذاكرة</span></div>

            </div>

            <div class="module-last-session-text">

              ${data.lastTopic ? `📌 آخر جلسة: <b>${data.lastTopic}</b> • 📅 ${formatRelativeDate(data.lastDate)}` : 'لم تبدأ المذاكرة في هذا الموديول بعد.'}

            </div>

          </div>

        `;

      });

      homeModulesContainer.innerHTML = modHtml;

    }

    // 16. Habit Consistency Analytics Matrix

    const habitStudyRate = Math.min(100, Math.round((Number(studyHours) / targetStudyHours) * 100));

    const habitGymRate = checkGym ? 100 : (period === 'today' ? (gymSessionsCount > 0 ? 100 : 0) : Math.min(100, Math.round((gymSessionsCount / (period === 'week' ? 5 : 20)) * 100)));

    const habitQuranRate = checkQuran ? 100 : Math.min(100, Math.round((totalQuranMins / (period === 'today' ? 30 : (period === 'week' ? 210 : 900))) * 100));

    const habitEngRate = checkEnglish ? 100 : 0;

    const habitFajrRate = checkFajrAdhkar ? 100 : 0;

    const habitAsrRate = checkAsrAdhkar ? 100 : 0;

    const setHabitUI = (idRate, idFill, rate) => {

      const rateEl = document.getElementById(idRate);

      const fillEl = document.getElementById(idFill);

      if (rateEl) rateEl.textContent = `${rate}%`;

      if (fillEl) fillEl.style.width = `${rate}%`;

    };

    setHabitUI('habitStudyRate', 'habitStudyFill', habitStudyRate);

    setHabitUI('habitGymRate', 'habitGymFill', habitGymRate);

    setHabitUI('habitQuranRate', 'habitQuranFill', habitQuranRate);

    setHabitUI('habitEngRate', 'habitEngFill', habitEngRate);

    setHabitUI('habitFajrRate', 'habitFajrFill', habitFajrRate);

    setHabitUI('habitAsrRate', 'habitAsrFill', habitAsrRate);

    const medBadgeEl = document.getElementById('homeMedQuizzesBadge');

    if (medBadgeEl) medBadgeEl.textContent = `${totalMedCount} أسئلة`;

  } catch (err) {

    console.warn('renderHomeOverview error:', err);

  }

}

// 🩺 1. Academic Modules, Schedule, Attendance & Medical Spaced Quizzes

async function renderAcademicSection() {

  const container = document.getElementById('semester7Courses');

  const schedEl = document.getElementById('academicScheduleList');

  const attEl = document.getElementById('attendanceLogsList');

  const attRateEl = document.getElementById('attendanceRate');

  const casesEl = document.getElementById('clinicalCasesList');

  const sessionsEl = document.getElementById('studySessionsList');

  const sessionsCountEl = document.getElementById('sessionsCount');

  const medSpacedList = document.getElementById('medSpacedList');

  const totalMedQuizzes = document.getElementById('totalMedQuizzes');

  const medQuizzesBadge = document.getElementById('medQuizzesBadge');

  const overallBadge = document.getElementById('medicalOverallStatsBadge');

  try {

    // 1. Fetch all study sessions

    const { data: sessions } = await userQuery('study_sessions').order('created_at', { ascending: false });

    // Group study time by module
    const activeCourses = window.USER_ACTIVE_COURSES || [
      { code: 'PED401', title: 'Pediatric 1 (طب الأطفال 1)' },
      { code: 'CAD402', title: 'Cardiac Disorders (أمراض القلب والأوعية)' },
      { code: 'HVD404', title: 'Hematological Disorders (أمراض الدم والأوعية)' },
      { code: 'RSD403', title: 'Respiratory Disorders (أمراض الجهاز التنفسي)' },
      { code: 'SKL 7', title: 'Clinical Skills 7 (المهارات الإكلينيكية)' }
    ];

    const moduleStats = {};
    activeCourses.forEach(c => {
      const code = c.code.toUpperCase();
      moduleStats[code] = {
        name: c.title,
        icon: getCourseIcon(c.title, c.code),
        credits: 5,
        mins: 0,
        count: 0,
        lastTopic: '',
        lastDur: 0,
        lastDate: ''
      };
    });

    let grandTotalMins = 0;

    (sessions || []).forEach(s => {
      const code = (s.course_code || 'MOD').trim().toUpperCase();
      const dur = Number(s.duration_minutes || 0);
      grandTotalMins += dur;

      if (!moduleStats[code]) {
        moduleStats[code] = {
          name: s.topic || `موديول [${code}]`,
          icon: getCourseIcon(s.topic || '', code),
          credits: 5,
          mins: 0,
          count: 0,
          lastTopic: '',
          lastDur: 0,
          lastDate: ''
        };
      }

      moduleStats[code].mins += dur;
      moduleStats[code].count++;

      if (!moduleStats[code].lastTopic || (s.date && s.date >= moduleStats[code].lastDate)) {
        moduleStats[code].lastTopic = s.topic || 'مذاكرة';
        moduleStats[code].lastDur = dur;
        moduleStats[code].lastDate = s.date || '';
      }
    });

    if (overallBadge) {

      const totalHrs = (grandTotalMins / 60).toFixed(1).replace('.0', '');

      overallBadge.textContent = `⏱️ إجمالي المذاكرة: ${totalHrs} ساعة (${grandTotalMins} دقيقة)`;

    }

    // Render Dynamic Clinical Module Cards

    if (container) {

      let modHtml = '';

      Object.entries(moduleStats).forEach(([code, data]) => {

        const hrs = (data.mins / 60).toFixed(1).replace('.0', '');

        modHtml += `

          <div class="module-progress-card">

            <div class="module-progress-header">

              <span class="module-code-badge">${code}</span>

              <span class="task-status-badge ${data.count > 0 ? 'status-done' : 'status-pending'}">${data.count > 0 ? `${data.count} جلسات` : 'بانتظار البدء'}</span>

            </div>

            <div class="module-name-title">${data.icon} ${data.name}</div>

            <div class="module-stats-row">

              <div class="module-study-hours-val">${hrs} <span>ساعة مذاكرة (${data.mins} د)</span></div>

              <div style="font-size: 0.78rem; color: var(--text-muted);">${data.credits} ساعات معتمدة</div>

            </div>

            <div class="module-last-session-text">

              ${data.lastTopic ? `📌 آخر جلسة: <b>${data.lastTopic}</b> (${data.lastDur} د) • 📅 ${formatRelativeDate(data.lastDate)}` : 'لم تسجل جلسات في هذا الموديول بعد.'}

            </div>

          </div>

        `;

      });

      container.innerHTML = modHtml;

    }

    // 2. Render Prominent Live Study Sessions Ledger

    if (sessions && sessions.length > 0) {

      if (sessionsCountEl) sessionsCountEl.textContent = `${sessions.length} جلسات مسجلة`;

      let sHtml = '';

      sessions.forEach(s => {

        const durMins = Number(s.duration_minutes || 0);

        let durText = durMins >= 60 ? `${(durMins / 60).toFixed(1).replace('.0', '')} ${durMins === 60 ? 'ساعة' : durMins === 120 ? 'ساعتين' : durMins >= 180 && durMins <= 600 ? 'ساعات' : 'ساعة'} (${durMins} دقيقة)` : `${durMins} دقيقة`;

        sHtml += `

          <div class="session-item" style="border-right: 4px solid var(--accent-primary); background: var(--bg-card-inner); padding: 16px; margin-bottom: 8px;">

            <div class="item-top-row">

              <span class="item-title" style="font-size: 1.08rem;">🩺 <b>[${s.course_code || 'CAD402'}]</b> ${s.topic || 'جلسة مذاكرة'} ${s.was_rescheduled ? '🔄 (مؤجل)' : ''}</span>

              <span class="task-status-badge status-done" style="font-size: 0.85rem; padding: 4px 10px;">⏱️ ${durText}</span>

            </div>

            <div class="item-desc" style="display: flex; gap: 16px; flex-wrap: wrap; margin-top: 8px; font-size: 0.88rem;">

              <span>📅 <b>التاريخ:</b> ${formatRelativeDate(s.date, s.created_at)}</span>

              ${s.pages_covered ? `<span>📄 <b>الصفحات:</b> ${s.pages_covered} صفحة</span>` : ''}

              ${s.comprehension_rating ? `<span>🧠 <b>الاستيعاب:</b> ${'⭐'.repeat(s.comprehension_rating)}</span>` : ''}

              ${s.session_type ? `<span>🏷️ <b>النوع:</b> ${s.session_type}</span>` : ''}

            </div>

            ${s.reschedule_reason ? `<div style="font-size: 0.82rem; color: var(--accent-gold); margin-top: 6px;">⚠️ <b>سبب التأجيل:</b> ${s.reschedule_reason}</div>` : ''}

            ${s.notes ? `<div style="font-size: 0.82rem; color: #cbd5e1; margin-top: 6px;">💬 <i>${s.notes}</i></div>` : ''}

          </div>

        `;

      });

      if (sessionsEl) sessionsEl.innerHTML = sHtml;

    } else {

      if (sessionsEl) sessionsEl.innerHTML = `<div class="empty-state">لا توجد جلسات مذاكرة مسجلة اليوم. أرسل فويس للبوت وسيقوم بتوثيق جلستك فوراً!</div>`;

    }

    // 3. Clinical Cases

    const { data: cases } = await userQuery('clinical_cases').order('date', { ascending: false }).limit(8);

    if (cases && cases.length > 0) {

      if (casesCountEl) casesCountEl.textContent = `${cases.length} حالات`;

      let cHtml = '';

      cases.forEach(c => {

        cHtml += `

          <div class="case-item">

            <div class="item-top-row"><span class="item-title">🩺 [${c.course_code || 'طب'}] ${c.title || 'حالة إكلينيكية'}</span><span class="item-date">📅 ${formatRelativeDate(c.date, c.created_at)}</span></div>

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

    // 4. Attendance Logs

    const { data: attList } = await userQuery('attendance_logs').order('date', { ascending: false }).limit(8);

    if (attList && attList.length > 0 && attEl) {

      let aHtml = '';

      let presentCount = 0;

      attList.forEach(a => {

        if (a.status === 'حضور') presentCount++;

        const isPresent = a.status === 'حضور';

        aHtml += `

          <div class="task-item">

            <div class="item-top-row">

              <span class="item-title">${isPresent ? '✅' : '⚠️'} [${a.course_code || 'طب'}] ${a.session_title || 'سيكشن'}</span>

              <span class="task-status-badge ${isPresent ? 'status-done' : 'status-pending'}">${a.status}</span>

            </div>

            <div class="item-desc">

              📅 ${formatRelativeDate(a.date, a.created_at)} ${a.reason ? `| السبب: ${a.reason}` : ''}

              ${a.makeup_plan ? `<br>🔄 <b>خطة التعويض:</b> ${a.makeup_plan}` : ''}

            </div>

          </div>

        `;

      });

      attEl.innerHTML = aHtml;

      if (attRateEl) attRateEl.textContent = `نسبة الحضور: ${Math.round((presentCount / attList.length) * 100)}%`;

    }

    // 5. Medical Spaced Quizzes

    const { data: quizzes } = await userQuery('medical_spaced_quizzes').order('created_at', { ascending: false });

    if (quizzes && quizzes.length > 0) {

      if (totalMedQuizzes) totalMedQuizzes.innerHTML = `${quizzes.length} <span class="stat-unit">سؤال</span>`;

      if (medQuizzesBadge) medQuizzesBadge.textContent = `${quizzes.length} أسئلة مبرمجة`;

      if (medSpacedList) {

        let qHtml = '';

        quizzes.forEach(q => {

          qHtml += `

            <div class="skill-card" style="border-color: rgba(56, 189, 248, 0.25);">

              <div class="item-top-row">

                <span class="skill-title">🩺 [${q.course_code || 'طب'}] ${q.topic || 'Clinical MCQ'}</span>

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

    // 6. Academic Schedule

    const { data: schedule } = await userQuery('academic_schedule').eq('is_active', true);

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

    const { data: cards } = await userQuery('english_spaced_flashcards').order('created_at', { ascending: false });

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

                <span class="thought-date">⏳ أضيف: ${formatRelativeDate(null, c.created_at)} • المراجعة: ${nextReview}</span>

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

    const { data: logs } = await userQuery('quran_logs').order('created_at', { ascending: false }).limit(10);

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

            <div class="item-top-row"><span class="item-title">🕌 سورة ${l.surah_name} (${l.session_type})</span><span class="item-date">📅 ${formatRelativeDate(l.date, l.created_at)}</span></div>

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
    const { data: pDb } = await userQuery('prayers_and_habits').eq('date', today).maybeSingle();
    const { data: uSess } = await db.from('bot_sessions').select('*').eq('chat_id', getUID()).maybeSingle();
    const sessPrayers = uSess?.data?.prayers_today || {};

    const p = {
      fajr: sessPrayers.fajr || pDb?.fajr,
      dhuhr: sessPrayers.dhuhr || pDb?.dhuhr,
      asr: sessPrayers.asr || pDb?.asr,
      maghrib: sessPrayers.maghrib || pDb?.maghrib,
      isha: sessPrayers.isha || pDb?.isha
    };

    const formatStatus = (val) => {
      if (!val || val === 'لم يُسجل' || val === 'لم تسجل') return 'لم تسجل ⚪';
      if (val.includes('مسجد') || val.includes('جماعة') || val.includes('حاضر') || val.includes('صليت') || val.includes('تم')) {
        return `✅ ${val.replace('🟢', '').trim()}`;
      }
      return val;
    };

    const setStatus = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = formatStatus(val);
    };

    setStatus('fajrStatus', p.fajr);
    setStatus('dhuhrStatus', p.dhuhr);
    setStatus('asrStatus', p.asr);
    setStatus('maghribStatus', p.maghrib);
    setStatus('ishaStatus', p.isha);

    // Fasting & Sunnah Logs
    const { data: fwToday } = await userQuery('fasting_and_worship_logs').eq('date', today).maybeSingle();

    const sunanCount = Number(fwToday?.sunan_rawatib_count ?? pDb?.sunan_rawatib ?? uSess?.data?.sunan_today ?? 0);
    if (sunanBoxVal) sunanBoxVal.textContent = `${sunanCount} / 12 ركعة`;

    const isAdhkarM = Boolean(fwToday?.adhkar_morning || pDb?.adhkar_morning || uSess?.data?.adhkar_morning);
    const isAdhkarE = Boolean(fwToday?.adhkar_evening || pDb?.adhkar_evening || uSess?.data?.adhkar_evening);
    if (adhkarBoxVal) adhkarBoxVal.textContent = `صباح: ${isAdhkarM ? '✅' : '⚪'} | مساء: ${isAdhkarE ? '✅' : '⚪'}`;

    const isDuha = Boolean(fwToday?.duha_prayer_done || uSess?.data?.duha_prayer_done);
    if (duhaBoxVal) duhaBoxVal.textContent = isDuha ? '✅ صليت الضحى' : 'لم تسجل ⚪';

    const isWitr = Boolean(fwToday?.witr_prayer_done || pDb?.qiyam_night || uSess?.data?.witr_prayer_done);
    if (qiyamBoxVal) qiyamBoxVal.textContent = isWitr ? '✅ صليت الوتر والقيام' : 'لم تسجل ⚪';

    const { data: fwHistory } = await userQuery('fasting_and_worship_logs').order('date', { ascending: false }).limit(6);

    if (fwHistory && fwHistory.length > 0 && listEl) {

      let html = '';

      fwHistory.forEach(f => {

        html += `

          <div class="session-item">

            <div class="item-top-row">

              <span class="item-title">🌙 ${f.fasting_type ? `${f.fasting_type} (${f.fasting_completed ? '✅ تم الصيام' : 'صائم'})` : 'يوم عادي'}</span>

              <span class="item-date">📅 ${formatRelativeDate(f.date, f.created_at)}</span>

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

    const { data: logs } = await userQuery('mental_wellness_logs').order('created_at', { ascending: false }).limit(6);

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

              <span class="thought-date">📅 ${formatRelativeDate(l.date, l.created_at)}</span>

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

    const { data: logs } = await userQuery('fitness_gym_logs').order('date', { ascending: false }).limit(6);

    if (logs && logs.length > 0 && container) {

      let html = '';

      logs.forEach(g => {

        html += `

          <div class="skill-card">

            <div class="skill-title">🏋️‍♂️ ${g.workout_type}</div>

            <div class="skill-meta">💪 العضلات: ${g.muscle_groups || 'عام'} | ⏱️ ${g.duration_minutes || 45} دقيقة (📅 ${formatRelativeDate(g.date, g.created_at)})</div>

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

    const { data: rows } = await userQuery('content_creation').order('created_at', { ascending: false }).limit(6);

    if (rows && rows.length > 0 && container) {

      let html = '';

      rows.forEach(c => {

        html += `

          <div class="skill-card">

            <div class="item-top-row">

              <span class="skill-title">🎬 ${c.title}</span>

              <span class="task-status-badge status-pending">${c.stage}</span>

            </div>

            <div class="skill-meta">📱 المنصة: ${c.platform} | 📅 ${formatRelativeDate(c.date, c.created_at)}</div>

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

    const { data: rows } = await userQuery('work_projects').order('created_at', { ascending: false }).limit(6);

    if (rows && rows.length > 0 && container) {

      let html = '';

      rows.forEach(w => {

        html += `

          <div class="skill-card">

            <div class="item-top-row">

              <span class="skill-title">💼 [${w.project_name}]</span>

              <span class="task-status-badge status-done">${w.status}</span>

            </div>

            <div class="skill-meta">📝 ${w.task_description} • 📅 ${formatRelativeDate(w.date, w.created_at)}</div>

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

    const { data: tasks } = await userQuery('daily_tasks').eq('date', today).order('created_at', { ascending: false });

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

            <div class="item-desc">⏱️ الهدف: ${t.target_duration_mins || 0} دقيقة | 🏷️ ${t.category} • 📅 ${formatRelativeDate(t.date, t.created_at)}</div>

          </div>

        `;

      });

      if (tasksEl) tasksEl.innerHTML = tHtml;

    }

    const { data: appts } = await userQuery('appointments_and_reminders').order('due_datetime', { ascending: true }).limit(8);

    if (appts && appts.length > 0) {

      if (apptsBadge) apptsBadge.textContent = `${appts.length} مواعيد`;

      let aHtml = '';

      appts.forEach(a => {

        aHtml += `

          <div class="appt-item">

            <div class="item-top-row"><span class="item-title">🔔 ${a.title}</span><span class="item-date">📅 ${formatRelativeDate(a.date, a.due_datetime || a.created_at)}</span></div>

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

    const { data: thoughts } = await userQuery('thoughts_and_wisdom').order('created_at', { ascending: false }).limit(9);

    if (thoughts && thoughts.length > 0 && grid) {

      let html = '';

      thoughts.forEach(th => {

        html += `

          <div class="thought-card">

            <div class="thought-content">“${th.content}”</div>

            <div class="thought-footer"><span class="thought-cat">🏷️ ${th.category}</span><span class="thought-date">📅 ${formatRelativeDate(th.date, th.created_at)}</span></div>

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

    const { data: sess } = await db.from('bot_sessions').select('*').eq('chat_id', getUID()).maybeSingle();

    const liq = sess?.data?.liquidity || {};

    const cashVal = liq['نقدي (كاش)'] ?? liq['خزنة شخصية'] ?? liq['نقدي'] ?? 0;
    const walletVal = liq['محفظة إلكترونية'] ?? liq['فودافون كاش'] ?? 0;
    const instapayVal = liq['إنستا باي'] ?? (Number(liq['إنستا باي'] || 0) + Number(liq['بنك مصر'] || 0));

    if (balCash) balCash.textContent = formatEgp(cashVal);
    if (balVodafone) balVodafone.textContent = formatEgp(walletVal);
    if (balInstapay) balInstapay.textContent = formatEgp(instapayVal);

    const { data: rows } = await userQuery('personal_finance').order('created_at', { ascending: false }).limit(25);

    if (tableBody) {

      if (rows && rows.length > 0) {

        let html = '';

        rows.forEach(r => {

          const isExp = r.type === 'مصروف' || r.type === 'expense';

          html += `

            <tr>

              <td>${formatRelativeDate(r.date, r.created_at)}</td>

              <td><span class="${isExp ? 'badge-expense' : 'badge-income'}">${r.type || 'مصروف'}</span></td>

              <td><b style="color: ${isExp ? '#f43f5e' : '#4ade80'};">${formatEgp(r.amount)}</b></td>

              <td>${r.description || '—'}</td>

              <td>${(r.payment_method || 'نقدي (كاش)').replace('خزنة شخصية', 'نقدي (كاش)').replace('فودافون كاش', 'محفظة إلكترونية').replace('بنك مصر', 'إنستا باي')}</td>

              <td>${r.category || 'عام'}</td>

            </tr>

          `;

        });

        tableBody.innerHTML = html;

      } else {

        tableBody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 24px; color: var(--text-muted);">لا توجد حركات مالية مسجلة بعد. أرسل فويس للبوت لتوثيق المصروف فوراً!</td></tr>`;

      }

    }

  } catch (err) {

    console.warn('renderFinanceSection error:', err);

  }

}

// ✏️ Modal Controller for Setting / Editing Starting Wallets & Liquidity Balances
let currentEditingWallet = null;

window.openWalletEditModal = function(walletName, elementId, icon = '💵') {
  currentEditingWallet = walletName;
  const modal = document.getElementById('walletModalOverlay');
  const titleText = document.getElementById('walletModalTitleText');
  const iconEl = document.getElementById('walletModalIcon');
  const inputEl = document.getElementById('walletModalInput');
  const currentEl = document.getElementById(elementId);

  if (titleText) titleText.textContent = `تعديل وتعيين رصيد ${walletName}`;
  if (iconEl) iconEl.textContent = icon;

  let currentVal = 0;
  if (currentEl) {
    const rawNum = currentEl.textContent.replace(/[^\d\.]/g, '').trim();
    currentVal = parseFloat(rawNum) || 0;
  }

  if (inputEl) {
    inputEl.value = currentVal || '';
    inputEl.placeholder = '0';
  }

  if (modal) {
    modal.style.display = 'flex';
    setTimeout(() => {
      if (inputEl) {
        inputEl.focus();
        inputEl.select();
      }
    }, 80);
  }
};

window.closeWalletModal = function(e) {
  if (e && e.target && e.target.id !== 'walletModalOverlay' && !e.target.classList.contains('wallet-modal-close') && !e.target.classList.contains('btn-wallet-cancel')) {
    return;
  }
  const modal = document.getElementById('walletModalOverlay');
  if (modal) modal.style.display = 'none';
  currentEditingWallet = null;
};

window.saveWalletBalanceFromModal = async function() {
  if (!currentEditingWallet) return;
  const inputEl = document.getElementById('walletModalInput');
  const saveBtn = document.getElementById('btnSaveWalletBalance');
  const valStr = inputEl?.value?.trim() || '0';
  const newAmount = parseFloat(valStr);

  if (isNaN(newAmount) || newAmount < 0) {
    alert('يرجى إدخال مبلغ مالي صحيح (0 أو أكثر).');
    return;
  }

  const originalText = saveBtn ? saveBtn.innerHTML : '';
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span>⏳ جاري الحفظ...</span>';
  }

  try {
    const uid = getUID();
    const { data: sess } = await db.from('bot_sessions').select('*').eq('chat_id', uid).maybeSingle();
    const sessData = sess?.data || {};
    if (!sessData.liquidity) sessData.liquidity = {};

    sessData.liquidity[currentEditingWallet] = newAmount;

    // Handle key aliases for 100% database compatibility
    if (currentEditingWallet === 'نقدي (كاش)') {
      sessData.liquidity['خزنة شخصية'] = newAmount;
      sessData.liquidity['نقدي'] = newAmount;
    } else if (currentEditingWallet === 'محفظة إلكترونية') {
      sessData.liquidity['فودافون كاش'] = newAmount;
    } else if (currentEditingWallet === 'إنستا باي') {
      sessData.liquidity['بنك مصر'] = 0;
    }

    const { error } = await db.from('bot_sessions').upsert({
      chat_id: uid,
      state: sess?.state || 'idle',
      data: sessData,
      updated_at: new Date().toISOString()
    });

    if (error) throw error;

    // Re-render finance UI immediately
    await renderFinanceSection();

    const modal = document.getElementById('walletModalOverlay');
    if (modal) modal.style.display = 'none';
    currentEditingWallet = null;

    if (typeof showToast === 'function') {
      showToast(`✅ تم تحديث رصيد ${currentEditingWallet} إلى ${formatEgp(newAmount)} بنجاح!`);
    } else {
      alert(`✅ تم تحديث رصيد ${currentEditingWallet} إلى ${formatEgp(newAmount)} بنجاح!`);
    }
  } catch (err) {
    console.error('saveWalletBalance error:', err);
    alert('❌ حدث خطأ أثناء حفظ الرصيد: ' + err.message);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText;
    }
  }
};

// 🚀 Dashboard Init & Live Data Refresh

let tabsInitialized = false;

async function initDashboard() {

  await applyUserPersonalization();

  if (!tabsInitialized) {

    initClockAndPrayers();

    initTabs();

    checkSandboxModeState();

    setInterval(checkSandboxModeState, 6000);

    tabsInitialized = true;

  }

  await Promise.allSettled([

    renderHomeOverview(),

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

    renderFinanceSection(),

    loadAdminPortalData()

  ]);

}

window.initDashboard = initDashboard;

window.renderHomeOverview = renderHomeOverview;

window.renderAcademicSection = renderAcademicSection;

// ==============================================================================

// 🧪 Sandbox Test Mode Engine (Backup Snapshot & Clean Restore)

// ==============================================================================

const SNAPSHOT_TABLES = [
  'personal_finance',
  'study_sessions',
  'quran_logs',
  'daily_tasks',
  'thoughts_and_wisdom',
  'appointments_and_reminders',
  'attendance_logs',
  'fitness_gym_logs',
  'english_spaced_flashcards',
  'medical_spaced_quizzes',
  'mental_wellness_logs',
  'work_projects',
  'content_creation',
  'fasting_and_worship_logs'
];

async function checkSandboxModeState() {
  const btn = document.getElementById('toggle-sandbox-btn');
  if (!btn) return;
  const uid = getUID();

  // Hide button completely for students - only Dr. Abdullah (Admin) sees it
  if (uid !== 1191760477) {
    btn.style.display = 'none';
    return;
  } else {
    btn.style.display = 'inline-flex';
  }

  try {
    const { data: row } = await db.from('bot_sessions').select('*').eq('chat_id', uid).maybeSingle();
    const isSandbox = row?.data?.sandbox_active === true;

    if (isSandbox) {
      btn.classList.add('sandbox-active');
      btn.title = 'وضع التجربة نشط! اضغط لإنهاء التجربة وإعادة البيانات الأصلية';
      btn.innerHTML = '<span>⏳</span> <span class="btn-text">إنهاء التجربة</span>';
      
      let banner = document.getElementById('sandbox-active-banner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'sandbox-active-banner';
        banner.className = 'sandbox-banner-bar';
        banner.innerHTML = `
          <span>⚠️ وضع تجربة البوت نشط حالياً لحسابك. أي تعديلات تسجلها لن تؤثر على بياناتك الأصلية.</span>
          <button type="button" class="btn-end-sandbox" onclick="toggleSandboxModeFromWeb()">إنهاء التجربة واستعادة البيانات</button>
        `;
        document.body.prepend(banner);
      }
    } else {
      btn.classList.remove('sandbox-active');
      btn.title = 'تفعيل أو إنهاء وضع تجربة البوت';
      btn.innerHTML = '<span>🧪</span> <span class="btn-text">تجربة البوت</span>';
      const banner = document.getElementById('sandbox-active-banner');
      if (banner) banner.remove();
    }
  } catch (e) {
    console.warn('checkSandboxModeState error:', e.message);
  }
}

async function toggleSandboxModeFromWeb() {
  const uid = getUID();
  if (uid !== 1191760477) {
    alert('وضع التجربة متاح فقط للمشرف العام.');
    return;
  }

  const btn = document.getElementById('toggle-sandbox-btn');
  const originalText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> <span class="btn-text">جاري الفحص...</span>';
  }

  try {
    const { data: row } = await db.from('bot_sessions').select('*').eq('chat_id', uid).maybeSingle();
    const isSandbox = row?.data?.sandbox_active === true;
    if (btn) btn.disabled = false;

    if (isSandbox) {
      await disableSandboxModeAndRestore();
    } else {
      await enableSandboxModeFromWeb();
    }
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
    alert('❌ حدث خطأ أثناء فحص حالة وضع التجربة: ' + err.message);
  }
}

async function enableSandboxModeFromWeb() {
  const uid = getUID();
  const proceed = confirm(
    '🧪 هل ترغب في تفعيل وضع تجربة واختبار البوت لحسابك؟\n\n' +
    '• سيتم أخذ لقطة حفظ احتياطية (Full Snapshot) لسجلاتك وبياناتك الحالية.\n' +
    '• يمكنك تجربة إرسال أي رسائل أو أوامر للبوت بحرية دون التأثير على الآخرين.\n' +
    '• عند إنهاء التجربة، سيتم حذف التعديلات التجريبية واستعادة سجلاتك الأصلية بدقة!'
  );
  if (!proceed) return;

  const btn = document.getElementById('toggle-sandbox-btn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> <span class="btn-text">جاري أخذ لقطة الحفظ...</span>';
  }

  try {
    const { data: row } = await db.from('bot_sessions').select('*').eq('chat_id', uid).maybeSingle();
    const sessionData = row?.data || {};

    // Take snapshot of current user rows only
    const snapshotPromises = SNAPSHOT_TABLES.map(async (tbl) => {
      const { data } = await db.from(tbl).select('*');
      const userRows = (data || []).filter(r => userMatchesRow(r, uid));
      return { tbl, rows: userRows };
    });

    const results = await Promise.all(snapshotPromises);
    const snapshotObj = {
      liquidity: { ...(sessionData.liquidity || {}) },
      created_at: new Date().toISOString()
    };

    results.forEach(({ tbl, rows }) => {
      snapshotObj[tbl] = rows;
    });

    sessionData.sandbox_snapshot = snapshotObj;
    sessionData.sandbox_active = true;

    const { error: upsertErr } = await db.from('bot_sessions').upsert({
      chat_id: uid,
      state: row?.state || 'idle',
      data: sessionData,
      updated_at: new Date().toISOString()
    });

    if (upsertErr) throw upsertErr;

    alert(
      '🧪 تم تفعيل وضع تجربة البوت بنجاح لحسابك!\n\n' +
      '✅ تم حفظ نسخة احتياطية لسجلاتك.\n' +
      'يمكنك الآن تجربة إرسال الأوامر بحرية، ولإلغاء التجربة اضغط الزر الأحمر بالأعلى.'
    );

    await checkSandboxModeState();
  } catch (e) {
    alert('❌ فشل تفعيل وضع التجربة: ' + e.message);
  } finally {
    if (btn) btn.disabled = false;
    await checkSandboxModeState();
  }
}

async function disableSandboxModeAndRestore() {
  const uid = getUID();
  const proceed = confirm(
    '🔴 هل أنت متأكد من إنهاء وضع التجربة واستعادة بياناتك وسجلاتك الأصلية؟'
  );
  if (!proceed) return;

  const btn = document.getElementById('toggle-sandbox-btn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> <span class="btn-text">جاري استعادة البيانات الأصلية...</span>';
  }

  try {
    const { data: row } = await db.from('bot_sessions').select('*').eq('chat_id', uid).maybeSingle();
    const sessionData = row?.data;

    if (!sessionData || !sessionData.sandbox_active || !sessionData.sandbox_snapshot) {
      alert('⚠️ وضع التجربة غير مفعل أو لا توجد لقطة احتياطية محفوظة!');
      if (btn) btn.disabled = false;
      return;
    }

    const snap = sessionData.sandbox_snapshot;

    // 1. Delete ONLY current user's records created during sandbox (do NOT wipe other users!)
    for (const tbl of SNAPSHOT_TABLES) {
      const { data: currentRows } = await db.from(tbl).select('*');
      const myRows = (currentRows || []).filter(r => userMatchesRow(r, uid));
      const myIds = myRows.map(r => r.id).filter(Boolean);
      
      if (myIds.length > 0) {
        for (let i = 0; i < myIds.length; i += 50) {
          const chunk = myIds.slice(i, i + 50);
          await db.from(tbl).delete().in('id', chunk);
        }
      }
    }

    // 2. Restore snapshot rows for this user
    for (const tbl of SNAPSHOT_TABLES) {
      const rows = snap[tbl];
      if (rows && rows.length > 0) {
        for (let i = 0; i < rows.length; i += 100) {
          const chunk = rows.slice(i, i + 100);
          await db.from(tbl).insert(chunk);
        }
      }
    }

    // 3. Restore liquidity and disable sandbox mode
    sessionData.liquidity = { ...(snap.liquidity || {}) };
    sessionData.sandbox_active = false;
    delete sessionData.sandbox_snapshot;

    await db.from('bot_sessions').upsert({
      chat_id: uid,
      state: row?.state || 'idle',
      data: sessionData,
      updated_at: new Date().toISOString()
    });

    alert('✅ تم إنهاء وضع التجربة وإعادة كافة سجلاتك للحالة الأصلية بنجاح دون التأثير على أي مستخدم آخر!');
    await checkSandboxModeState();
    if (typeof loadAllDashboardData === 'function') await loadAllDashboardData();
  } catch (e) {
    alert('❌ فشل استعادة البيانات: ' + e.message);
  } finally {
    if (btn) btn.disabled = false;
    await checkSandboxModeState();
  }
}

// Global exposure

window.checkSandboxModeState = checkSandboxModeState;

window.toggleSandboxModeFromWeb = toggleSandboxModeFromWeb;

window.enableSandboxModeFromWeb = enableSandboxModeFromWeb;

window.disableSandboxModeAndRestore = disableSandboxModeAndRestore;

// 👑 Admin Management Hub

async function loadAdminPortalData() {

  const adminTabBtn = document.getElementById('nav-item-admin');

  const urlUserId = new URLSearchParams(window.location.search).get('telegram_id');

  const tgUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

  const currentUserId = Number(urlUserId || tgUserId || '1191760477');

  if (currentUserId !== 1191760477) {

    if (adminTabBtn) adminTabBtn.style.display = 'none';

    return;

  }

  if (adminTabBtn) adminTabBtn.style.display = 'flex';

  try {

    const res = await fetch('/api/dashboard_data?telegram_id=1191760477');

    const data = await res.json();

    if (!data.ok || !data.admin) return;

    const { total_students, students, pending_payments } = data.admin;

    // 1. Stats

    const totalEl = document.getElementById('adminTotalStudents');

    const activeEl = document.getElementById('adminActiveStudents');

    const trialEl = document.getElementById('adminTrialStudents');

    const pendingEl = document.getElementById('adminPendingPaymentsCount');

    if (totalEl) totalEl.textContent = total_students || 0;

    const activeCount = (students || []).filter(s => s.subscription_status === 'active' || s.subscription_status === 'lifetime').length;

    const trialCount = (students || []).filter(s => s.subscription_status === 'trial').length;

    if (activeEl) activeEl.textContent = activeCount;

    if (trialEl) trialEl.textContent = trialCount;

    if (pendingEl) pendingEl.textContent = (pending_payments || []).length;

    // 2. Pending Payments

    const payList = document.getElementById('adminPendingPaymentsList');

    if (payList) {

      if (pending_payments && pending_payments.length > 0) {

        payList.innerHTML = pending_payments.map(p => `

          <div class="list-item" style="padding: 14px; margin-bottom: 10px; background: rgba(30, 41, 59, 0.6); border-radius: 12px; border: 1px solid rgba(251, 191, 36, 0.3);">

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">

              <div>

                <b style="font-size: 1rem; color: #fff;">${p.student_name || 'طالب زميل'}</b> (معرف: <code>${p.telegram_id}</code>)

                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">

                  الباقة: <b>${p.plan_type || 'شهر (30 يوم)'}</b> • المبلغ: <b style="color: #34d399;">${p.amount_egp || 30} ج.م</b> • وسيلة الدفع: <b>${p.payment_method || 'فودافون كاش'}</b>

                </div>

              </div>

              <span class="badge badge-warning">معلق ⏳</span>

            </div>

            ${p.receipt_image_url ? `<div style="margin: 10px 0;"><a href="${p.receipt_image_url}" target="_blank"><img src="${p.receipt_image_url}" style="max-height: 120px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);" alt="إيصال التحويل"></a></div>` : ''}

            <div style="display: flex; gap: 8px; margin-top: 10px;">

              <button class="btn btn-sm btn-success" onclick="approveStudentPayment(${p.id}, ${p.telegram_id}, 30)">✅ قبول وتفعيل شهر (30 يوم)</button>

              <button class="btn btn-sm btn-success" onclick="approveStudentPayment(${p.id}, ${p.telegram_id}, 120)">💎 تفعيل ترم (120 يوم)</button>

              <button class="btn btn-sm btn-danger" onclick="rejectStudentPayment(${p.id})">❌ رفض</button>

            </div>

          </div>

        `).join('');

      } else {

        payList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 15px;">✨ لا توجد إيصالات تحويل معلقة حالياً.</p>';

      }

    }

    // 3. Students Table

        const tbody = document.getElementById('adminStudentsTableBody');
    const cardsContainer = document.getElementById('adminStudentsCardsContainer');

    if (students && students.length > 0) {
      const getBadge = (s) => {
        if (s.subscription_status === 'trial') return '<span class="badge" style="background:rgba(245,158,11,0.15); color:#fbbf24; border:1px solid rgba(245,158,11,0.3); padding:4px 10px; border-radius:20px; font-weight:700;">فترة تجريبية 🎁</span>';
        if (s.subscription_status === 'expired') return '<span class="badge" style="background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.3); padding:4px 10px; border-radius:20px; font-weight:700;">منتهي 🔴</span>';
        if (s.subscription_status === 'lifetime') return '<span class="badge" style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3); padding:4px 10px; border-radius:20px; font-weight:700;">مدى الحياة 👑</span>';
        return '<span class="badge" style="background:rgba(16,185,129,0.15); color:#34d399; border:1px solid rgba(16,185,129,0.3); padding:4px 10px; border-radius:20px; font-weight:700;">نشط 🟢</span>';
      };

      // 1. Desktop Table
      if (tbody) {
        tbody.innerHTML = students.map(s => {
          const tid = s.telegram_id || '—';
          const daysStr = typeof s.days_remaining === 'number' ? `${s.days_remaining} يوم` : s.days_remaining;
          return `
            <tr>
              <td>
                <b style="color:#fff; font-size:0.95rem;">${s.full_name || 'طالب زميل'}</b>
                ${s.username ? `<br><small style="color:var(--text-muted)">@${s.username}</small>` : ''}
              </td>
              <td><code>${tid}</code></td>
              <td>${getBadge(s)}</td>
              <td><b style="color:#fff; font-size:0.95rem;">${daysStr}</b></td>
              <td>
                <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
                  <button class="btn-action-emerald" style="padding:6px 10px; font-size:0.75rem;" onclick="modifyStudentSubscription(${tid}, 30, 'active')">🎁 +30 يوم</button>
                  <button class="btn-action-sky" style="padding:6px 10px; font-size:0.75rem;" onclick="modifyStudentSubscription(${tid}, 120, 'active')">💎 +120 يوم</button>
                  <button class="btn-action-gold" style="padding:6px 10px; font-size:0.75rem;" onclick="modifyStudentSubscription(${tid}, 3650, 'lifetime')">👑 مدى الحياة</button>
                  <button class="btn-action-rose" style="padding:6px 10px; font-size:0.75rem;" onclick="modifyStudentSubscription(${tid}, 0, 'expired')">🚫 إيقاف</button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }

      // 2. Mobile Cards Grid
      if (cardsContainer) {
        cardsContainer.innerHTML = students.map(s => {
          const tid = s.telegram_id || '—';
          const daysStr = typeof s.days_remaining === 'number' ? `${s.days_remaining} يوم` : s.days_remaining;
          return `
            <div class="student-admin-card">
              <div class="student-card-header">
                <div class="student-info-box">
                  <div class="student-avatar-badge">🩺</div>
                  <div>
                    <div class="student-name-text">${s.full_name || 'طالب زميل'}</div>
                    ${s.username ? `<span class="student-username-text">@${s.username}</span>` : ''}
                  </div>
                </div>
                ${getBadge(s)}
              </div>
              <div class="student-card-meta">
                <div><span>🆔 المعرف:</span> <code>${tid}</code></div>
                <div><span>⏳ الصلاحية:</span> <b style="color:#34d399;">${daysStr}</b></div>
              </div>
              <div class="student-card-actions-grid">
                <button class="btn-action-emerald" onclick="modifyStudentSubscription(${tid}, 30, 'active')">🎁 +30 يوم (شهر)</button>
                <button class="btn-action-sky" onclick="modifyStudentSubscription(${tid}, 120, 'active')">💎 +120 يوم (ترم)</button>
                <button class="btn-action-gold" onclick="modifyStudentSubscription(${tid}, 3650, 'lifetime')">👑 مدى الحياة</button>
                <button class="btn-action-rose" onclick="modifyStudentSubscription(${tid}, 0, 'expired')">🚫 إيقاف الحساب</button>
              </div>
            </div>
          `;
        }).join('');
      }
    } else {
      if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">لا يوجد طلاب مسجلون بعد.</td></tr>';
      if (cardsContainer) cardsContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">لا يوجد طلاب مسجلون بعد.</div>';
    }

  } catch (err) {
    console.error('loadAdminPortalData error:', err);
  }
}

async function modifyStudentSubscription(telegramId, days, status) {

  const actionLabel = status === 'lifetime' ? 'ترقية لمدى الحياة' : status === 'expired' ? 'إيقاف الحساب' : `إضافة ${days} يوم`;

  if (!confirm(`هل أنت متأكد من ${actionLabel} للطالب (${telegramId})؟`)) return;

  try {

    const { data: row } = await db.from('bot_sessions').select('*').eq('chat_id', telegramId).maybeSingle();

    const sessionData = row?.data || {};

    const profile = sessionData.profile || {};

    const nowMs = Date.now();

    let newEnd;

    let finalDays;

    if (status === 'lifetime') {

      finalDays = 3650;

      newEnd = new Date(nowMs + 3650 * 24 * 3600 * 1000).toISOString();

    } else if (status === 'expired') {

      finalDays = 0;

      newEnd = new Date(nowMs - 60000).toISOString();

    } else {

      const currentRemaining = Math.max(0, Number(profile.days_remaining || 0));

      finalDays = currentRemaining + days;

      newEnd = new Date(nowMs + finalDays * 24 * 3600 * 1000).toISOString();

    }

    profile.subscription_status = status;

    profile.days_remaining = finalDays;

    profile.subscription_ends_at = newEnd;

    profile.is_active = status !== 'expired';

    profile.is_trial = status === 'trial';

    sessionData.profile = profile;

    await db.from('bot_sessions').upsert({

      chat_id: telegramId,

      state: row?.state || 'idle',

      data: sessionData,

      updated_at: new Date().toISOString()

    });

    alert('✅ تم تحديث وتفعيل اشتراك الطالب بنجاح!');

    await loadAdminPortalData();

  } catch (e) {

    alert('❌ خطأ: ' + e.message);

  }

}

async function approveStudentPayment(paymentId, telegramId, days) {

  try {

    await db.from('subscription_payments').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', paymentId);

    await modifyStudentSubscription(telegramId, days, 'active');

  } catch (e) {

    alert('❌ خطأ في الموافقة: ' + e.message);

  }

}

async function rejectStudentPayment(paymentId) {

  if (!confirm('هل أنت متأكد من رفض الإيصال؟')) return;

  try {

    await db.from('subscription_payments').update({ status: 'rejected' }).eq('id', paymentId);

    alert('تم رفض الإيصال.');

    await loadAdminPortalData();

  } catch (e) {

    alert('❌ خطأ: ' + e.message);

  }

}

window.loadAdminPortalData = loadAdminPortalData;

window.modifyStudentSubscription = modifyStudentSubscription;

window.approveStudentPayment = approveStudentPayment;

window.rejectStudentPayment = rejectStudentPayment;

// Immediate initialization if already authenticated

if (typeof localStorage !== 'undefined' && localStorage.getItem('abdallah_journey_auth_token') === 'authenticated_dr_abdallah_secure_key_2026') {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initDashboard();
  } else {
    document.addEventListener('DOMContentLoaded', () => initDashboard());
  }
}

// ⏰ Auto-heartbeat to trigger due reminders and keep scheduler active
setInterval(() => {
  fetch('/api/cron').catch(() => {});
}, 30000);

