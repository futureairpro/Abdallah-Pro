// 📱 Telegram Mini App (Web App) Master Dashboard for Abdullah's Journey & Doctor OS
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  return res.status(200).send(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>منظومة الطبيب الذكية | Doctor OS Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Inter:wght@500;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #070a12;
      --card-bg: rgba(15, 23, 42, 0.82);
      --card-border: rgba(56, 189, 248, 0.18);
      --primary: #38bdf8;
      --primary-glow: rgba(56, 189, 248, 0.25);
      --accent: #10b981;
      --accent-glow: rgba(16, 185, 129, 0.22);
      --gold: #fbbf24;
      --gold-glow: rgba(251, 191, 36, 0.22);
      --rose: #f43f5e;
      --indigo: #818cf8;
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', system-ui, sans-serif; -webkit-tap-highlight-color: transparent; }
    body {
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 14px 14px 90px 14px;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }

    /* Ambient Background Lights */
    body::before {
      content: ''; position: fixed; top: -80px; left: -80px; width: 280px; height: 280px;
      background: radial-gradient(circle, var(--primary-glow) 0%, transparent 70%); z-index: -1; pointer-events: none;
    }
    body::after {
      content: ''; position: fixed; bottom: -80px; right: -80px; width: 280px; height: 280px;
      background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%); z-index: -1; pointer-events: none;
    }

    /* Top Header Bar */
    .top-header {
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: 14px 18px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(14px);
    }
    .user-box { display: flex; align-items: center; gap: 12px; }
    .avatar-icon {
      width: 44px; height: 44px; border-radius: 14px;
      background: linear-gradient(135deg, #0284c7, #0369a1);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; box-shadow: 0 4px 15px var(--primary-glow);
    }
    .user-meta h1 { font-size: 1rem; font-weight: 800; color: #fff; line-height: 1.2; }
    .user-meta span { font-size: 0.75rem; color: var(--text-muted); }
    .badge-status {
      font-size: 0.75rem; font-weight: 700; padding: 5px 12px; border-radius: 20px;
      background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);
      display: flex; align-items: center; gap: 5px;
    }

    /* Tab Content Wrappers */
    .tab-content { display: none; animation: fadeIn 0.25s ease-out forwards; }
    .tab-content.active { display: block; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Common Card Styling */
    .app-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: 18px;
      margin-bottom: 14px;
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
    .card-title {
      font-size: 0.95rem; font-weight: 800; color: var(--primary);
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 14px;
    }
    .card-title .icon { font-size: 1.1rem; }

    /* Prayer Times Pill Grid */
    .prayers-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 6px;
    }
    .prayer-item {
      background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px; padding: 8px 6px; text-align: center;
    }
    .prayer-name { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
    .prayer-time { font-size: 0.85rem; color: #fff; font-weight: 800; margin-top: 2px; font-family: 'Cairo', sans-serif; }

    /* Mindset Pulse Card */
    .pulse-card {
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
      border: 1px solid rgba(251, 191, 36, 0.3);
      position: relative; overflow: hidden;
    }
    .pulse-card::before {
      content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%;
      background: linear-gradient(180deg, var(--gold), #f59e0b);
    }
    .pulse-header { font-size: 0.9rem; font-weight: 800; color: var(--gold); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
    .pulse-text { font-size: 0.85rem; line-height: 1.6; color: #e2e8f0; }

    /* Study Ring */
    .study-box { text-align: center; }
    .ring-container { position: relative; width: 130px; height: 130px; margin: 0 auto 12px; }
    .ring-svg { transform: rotate(-90deg); width: 130px; height: 130px; }
    .ring-bg { fill: none; stroke: rgba(255, 255, 255, 0.06); stroke-width: 11; }
    .ring-progress {
      fill: none; stroke: url(#studyGrad); stroke-width: 11; stroke-linecap: round;
      stroke-dasharray: 350; stroke-dashoffset: 350; transition: stroke-dashoffset 1s ease-out;
    }
    .ring-text {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      text-align: center;
    }
    .ring-text .hours { font-size: 1.5rem; font-weight: 900; color: #fff; line-height: 1; }
    .ring-text .label { font-size: 0.7rem; color: var(--text-muted); margin-top: 3px; }

    .module-list { display: grid; gap: 8px; margin-top: 14px; text-align: right; }
    .module-item { background: rgba(30, 41, 59, 0.4); border-radius: 12px; padding: 8px 12px; border: 1px solid rgba(255,255,255,0.05); }
    .module-row { display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px; }
    .bar-bg { height: 6px; background: rgba(255, 255, 255, 0.08); border-radius: 8px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 8px; background: linear-gradient(90deg, #38bdf8, #818cf8); transition: width 0.8s ease; }

    /* List Items (Tasks, Finance, Worship, etc.) */
    .list-stack { display: grid; gap: 8px; }
    .list-item {
      background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;
    }
    .item-left { display: flex; align-items: center; gap: 10px; }
    .item-title { font-size: 0.85rem; font-weight: 700; color: #f1f5f9; }
    .item-sub { font-size: 0.75rem; color: var(--text-muted); }
    .badge-pill {
      font-size: 0.7rem; font-weight: 700; padding: 3px 8px; border-radius: 12px;
      background: rgba(56, 189, 248, 0.15); color: #38bdf8;
    }

    /* Interactive Quiz / Flashcard Card */
    .interactive-card {
      background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(56, 189, 248, 0.2);
      border-radius: 16px; padding: 14px; margin-bottom: 10px;
    }
    .quiz-course { font-size: 0.75rem; font-weight: 800; color: var(--primary); margin-bottom: 4px; }
    .quiz-q { font-size: 0.9rem; font-weight: 700; color: #fff; line-height: 1.4; margin-bottom: 10px; }
    .quiz-answer-box {
      background: rgba(15, 23, 42, 0.8); border-radius: 10px; padding: 10px;
      margin-top: 8px; font-size: 0.8rem; line-height: 1.5; color: #cbd5e1; display: none;
    }
    .btn-reveal {
      width: 100%; background: linear-gradient(135deg, #0284c7, #0369a1); border: none;
      color: #fff; padding: 8px; border-radius: 10px; font-size: 0.8rem; font-weight: 700;
      cursor: pointer; transition: transform 0.1s;
    }
    .btn-reveal:active { transform: scale(0.98); }

    /* Finance Stats */
    .fin-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }
    .fin-box {
      background: rgba(30, 41, 59, 0.5); border-radius: 12px; padding: 10px 6px; text-align: center;
      border: 1px solid rgba(255,255,255,0.06);
    }
    .fin-box.income .fin-num { color: #34d399; }
    .fin-box.expense .fin-num { color: #f87171; }
    .fin-box.net .fin-num { color: #38bdf8; }
    .fin-lbl { font-size: 0.7rem; color: var(--text-muted); }
    .fin-num { font-size: 0.95rem; font-weight: 900; margin-top: 2px; }

    /* Worship Grid */
    .worship-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .worship-card {
      background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255,255,255,0.06);
      border-radius: 14px; padding: 12px; text-align: center;
    }
    .worship-icon { font-size: 1.4rem; margin-bottom: 4px; }
    .worship-val { font-size: 0.85rem; font-weight: 800; color: #fff; margin-top: 2px; }

    /* Fixed Bottom Navigation Bar */
    .bottom-nav {
      position: fixed; bottom: 0; left: 0; right: 0; height: 72px;
      background: rgba(15, 23, 42, 0.92); border-top: 1px solid var(--card-border);
      backdrop-filter: blur(16px); display: flex; justify-content: space-around;
      align-items: center; padding: 0 8px; z-index: 100;
    }
    .nav-btn {
      background: none; border: none; color: var(--text-muted);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 3px; font-size: 0.7rem; font-weight: 700; cursor: pointer;
      flex: 1; padding: 6px 0; transition: color 0.2s, transform 0.1s;
    }
    .nav-btn .nav-icon { font-size: 1.25rem; transition: transform 0.2s; }
    .nav-btn.active { color: var(--primary); }
    .nav-btn.active .nav-icon { transform: scale(1.15); filter: drop-shadow(0 2px 8px var(--primary-glow)); }

    /* Loading Spinner */
    .loading-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: var(--bg); display: flex; flex-direction: column;
      align-items: center; justify-content: center; z-index: 999;
    }
    .spinner {
      width: 44px; height: 44px; border: 4px solid rgba(56, 189, 248, 0.15);
      border-top-color: var(--primary); border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>

  <!-- Loading State -->
  <div class="loading-overlay" id="loadingOverlay">
    <div class="spinner"></div>
    <p style="margin-top: 16px; font-size: 0.9rem; font-weight: 700; color: #94a3b8;">جاري تحميل منظومة الطبيب الذكية...</p>
  </div>

  <!-- SVG Gradients -->
  <svg style="position: absolute; width: 0; height: 0;">
    <defs>
      <linearGradient id="studyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#818cf8" />
      </linearGradient>
    </defs>
  </svg>

  <!-- Top Header Profile -->
  <header class="top-header">
    <div class="user-box">
      <div class="avatar-icon">🩺</div>
      <div class="user-meta">
        <h1 id="userFullName">المنظومة الطبية الذكية</h1>
        <span id="userAcademic">Doctor OS 🎯</span>
      </div>
    </div>
    <div class="badge-status" id="userBadge">
      <span>🟢</span> <span id="badgeText">نشط</span>
    </div>
  </header>

  <!-- ========================================================================= -->
  <!-- 🏠 TAB 1: الرئيسية (Overview & Home) -->
  <!-- ========================================================================= -->
  <div class="tab-content active" id="tab-home">
    
    <!-- 🕌 مواقيت الصلاة 12 ساعة -->
    <div class="app-card">
      <div class="card-title">
        <span>🕌 مواقيت الصلاة الحية بالقاهرة (12 ساعة)</span>
        <span class="icon">⏰</span>
      </div>
      <div class="prayers-grid">
        <div class="prayer-item"><div class="prayer-name">الفجر</div><div class="prayer-time" id="p-fajr">--:-- ص</div></div>
        <div class="prayer-item"><div class="prayer-name">الشروق</div><div class="prayer-time" id="p-sunrise">--:-- ص</div></div>
        <div class="prayer-item"><div class="prayer-name">الظهر</div><div class="prayer-time" id="p-dhuhr">--:-- م</div></div>
        <div class="prayer-item"><div class="prayer-name">العصر</div><div class="prayer-time" id="p-asr">--:-- م</div></div>
        <div class="prayer-item"><div class="prayer-name">المغرب</div><div class="prayer-time" id="p-maghrib">--:-- م</div></div>
        <div class="prayer-item"><div class="prayer-name">العشاء</div><div class="prayer-time" id="p-isha">--:-- م</div></div>
      </div>
    </div>

    <!-- ⚡ نبضة المجد واليقين والانضباط -->
    <div class="app-card pulse-card" id="mindsetPulseCard">
      <div class="pulse-header">⚡ نبضة المجد والانضباط واليقين 👑</div>
      <div class="pulse-text" id="mindsetPulseText">يا دكتور، اتمكن من مقاود عقلك الباطن اليوم؛ أنت تبني مستقبلك بالصبر والانضباط والاستمرار.</div>
    </div>

    <!-- 🩺 حلقة المذاكرة اليومية -->
    <div class="app-card study-box">
      <div class="card-title">
        <span>🩺 إنجاز المذاكرة اليومية (الهدف: 3 ساعات)</span>
        <span class="icon">📚</span>
      </div>
      <div class="ring-container">
        <svg class="ring-svg" viewBox="0 0 130 130">
          <circle class="ring-bg" cx="65" cy="65" r="56"></circle>
          <circle class="ring-progress" id="studyRingCircle" cx="65" cy="65" r="56"></circle>
        </svg>
        <div class="ring-text">
          <div class="hours" id="studyHoursText">0.0 س</div>
          <div class="label" id="studyMinsText">0 دقيقة</div>
        </div>
      </div>
      <div class="module-list" id="moduleList">
        <!-- Dynamic Module Bars -->
      </div>
    </div>

    <!-- 🎯 المهام السريعة لليوم -->
    <div class="app-card">
      <div class="card-title">
        <span>🎯 مهام ومواعيد اليوم</span>
        <span class="badge-pill" id="taskCountBadge">0 مهام</span>
      </div>
      <div class="list-stack" id="homeTasksList">
        <p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">لا توجد مهام مسجلة اليوم.</p>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- 🩺 TAB 2: الطب والسكاشن (Medical & Quizzes) -->
  <!-- ========================================================================= -->
  <div class="tab-content" id="tab-medical">
    <div class="app-card">
      <div class="card-title">
        <span id="academicYearTitle">🩺 الموديولات الأكاديمية النشطة</span>
        <span class="icon">🏥</span>
      </div>
      <div class="list-stack" id="academicModulesList">
        <p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">جاري تحميل الموديولات...</p>
      </div>
    </div>

    <div class="app-card">
      <div class="card-title">
        <span>🧪 بنك الكويزات الطبية بالتكرار المتباعد</span>
        <span class="icon">🔬</span>
      </div>
      <div id="medicalQuizzesContainer">
        <p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">جاري جلب الأسئلة السريرية...</p>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- 🗣️ TAB 3: فلاش كاردز الإنجليزية (English B2/C1) -->
  <!-- ========================================================================= -->
  <div class="tab-content" id="tab-english">
    <div class="app-card">
      <div class="card-title">
        <span>🗣️ فلاش كاردز الإنجليزية الطبية والحياتية (B2/C1)</span>
        <span class="icon">🇬🇧</span>
      </div>
      <p style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 12px;">مفردات متقدمة مسجلة من محادثاتك مع المدرب الذكي.</p>
      <div id="englishCardsContainer">
        <p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">لا توجد بطاقات مسجلة بعد.</p>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- 🎯 TAB 4: المهام والمواعيد (Tasks & Due) -->
  <!-- ========================================================================= -->
  <div class="tab-content" id="tab-tasks">
    <div class="app-card">
      <div class="card-title">
        <span>⏰ المواعيد والتذكيرات القادمة (12 ساعة)</span>
        <span class="icon">🔔</span>
      </div>
      <div class="list-stack" id="appointmentsFullList">
        <p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">لا توجد مواعيد مسجلة.</p>
      </div>
    </div>

    <div class="app-card">
      <div class="card-title">
        <span>🎯 قائمة المهام اليومية</span>
        <span class="icon">📋</span>
      </div>
      <div class="list-stack" id="tasksFullList">
        <p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">لا توجد مهام مسجلة اليوم.</p>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- 💵 TAB 5: الخزنة والمالية (Finance) -->
  <!-- ========================================================================= -->
  <div class="tab-content" id="tab-finance">
    <div class="app-card">
      <div class="card-title">
        <span>💵 ملخص الخزنة والمصروفات اليومية</span>
        <span class="icon">💳</span>
      </div>
      <div class="fin-stats">
        <div class="fin-box income"><div class="fin-lbl">إيرادات</div><div class="fin-num" id="finIncome">0 ج.م</div></div>
        <div class="fin-box expense"><div class="fin-lbl">مصروفات</div><div class="fin-num" id="finExpense">0 ج.م</div></div>
        <div class="fin-box net"><div class="fin-lbl">الصافي</div><div class="fin-num" id="finNet">0 ج.م</div></div>
      </div>
      <div class="list-stack" id="financeTransactionsList">
        <p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">لا توجد حركات مالية مسجلة اليوم.</p>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- 📖 TAB 6: القرآن والعبادات (Worship) -->
  <!-- ========================================================================= -->
  <div class="tab-content" id="tab-worship">
    <div class="app-card">
      <div class="card-title">
        <span>📖 سجل المصحف وتثبيت الحفظ</span>
        <span class="icon">🕌</span>
      </div>
      <div class="list-stack" id="quranLogsList">
        <p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">لم تسجل ورد قرآني اليوم.</p>
      </div>
    </div>

    <div class="app-card">
      <div class="card-title">
        <span>🌙 الصيام والسنن والأذكار</span>
        <span class="icon">📿</span>
      </div>
      <div class="worship-grid">
        <div class="worship-card"><div class="worship-icon">🥣</div><div>الصيام</div><div class="worship-val" id="worshipFasting">غير مسجل</div></div>
        <div class="worship-card"><div class="worship-icon">🕌</div><div>السنن الرواتب</div><div class="worship-val" id="worshipSunan">0 / 12 ركعة</div></div>
        <div class="worship-card"><div class="worship-icon">☀️</div><div>صلاة الضحى</div><div class="worship-val" id="worshipDuha">⚪ لم تُسجل</div></div>
        <div class="worship-card"><div class="worship-icon">🌌</div><div>صلاة الوتر</div><div class="worship-val" id="worshipWitr">⚪ لم تُسجل</div></div>
      </div>
    </div>

    <div class="app-card">
      <div class="card-title">
        <span>🏋️‍♂️ الجيم واللياقة والبدنية</span>
        <span class="icon">💪</span>
      </div>
      <div class="list-stack" id="gymLogsList">
        <p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">لم تسجل تمارين اليوم.</p>
      </div>
    </div>

    <div class="app-card">
      <div class="card-title">
        <span>🧠 الاتزان النفسي وبنك الخواطر</span>
        <span class="icon">💡</span>
      </div>
      <div class="list-stack" id="wellnessThoughtsList">
        <p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">لا توجد خواطر مسجلة اليوم.</p>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- 📱 Fixed Bottom Navigation Bar -->
  <!-- ========================================================================= -->
  <nav class="bottom-nav">
    <button class="nav-btn active" onclick="switchTab('home', this)">
      <span class="nav-icon">🏠</span>
      <span>الرئيسية</span>
    </button>
    <button class="nav-btn" onclick="switchTab('medical', this)">
      <span class="nav-icon">🩺</span>
      <span>الطب</span>
    </button>
    <button class="nav-btn" onclick="switchTab('english', this)">
      <span class="nav-icon">🗣️</span>
      <span>الإنجليزية</span>
    </button>
    <button class="nav-btn" onclick="switchTab('tasks', this)">
      <span class="nav-icon">🎯</span>
      <span>المهام</span>
    </button>
    <button class="nav-btn" onclick="switchTab('finance', this)">
      <span class="nav-icon">💵</span>
      <span>المالية</span>
    </button>
    <button class="nav-btn" onclick="switchTab('worship', this)">
      <span class="nav-icon">📖</span>
      <span>العبادات</span>
    </button>
  </nav>

  <!-- Client Script -->
  <script>
    // Initialize Telegram Web App
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }

    // Determine current user ID
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('telegram_id') || tg?.initDataUnsafe?.user?.id || '8925138241';

    function switchTab(tabId, btnEl) {
      if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
      
      const target = document.getElementById('tab-' + tabId);
      if (target) target.classList.add('active');
      if (btnEl) btnEl.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function toggleReveal(id) {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = el.style.display === 'block' ? 'none' : 'block';
        if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
      }
    }

    async function loadDashboardData() {
      try {
        const res = await fetch('/api/dashboard_data?telegram_id=' + userId);
        const data = await res.json();

        if (!data.ok) throw new Error(data.error || 'Failed to load');

        // 1. User Meta
        document.getElementById('userFullName').textContent = data.user?.full_name || 'دكتور زميل';
        if (data.user?.role === 'admin') {
          document.getElementById('userAcademic').textContent = 'المؤسس والمدير • منظومة رحلة عبدالله 👑';
          document.getElementById('badgeText').textContent = 'المدير 👑';
        } else {
          document.getElementById('userAcademic').textContent = `${data.user?.academic_year || 'الفرقة الرابعة'} (${data.user?.semester || 'الترم الأول'}) • كلية الطب البشري 🩺`;
          document.getElementById('badgeText').textContent = data.user?.subscription_status === 'trial' ? 'فترة تجريبية' : 'طالب نشط';
        }

        // Tab visibility based on preferences
        if (data.user?.preferences) {
          const p = data.user.preferences;
          const setBtn = (tab, show) => {
            const b = document.querySelector(`.tab-btn[onclick="switchTab('${tab}')"]`);
            if (b) b.style.display = show ? 'flex' : 'none';
          };
          setBtn('english', p.english !== false);
          setBtn('quran', p.islamic !== false);
          setBtn('fasting', p.islamic !== false);
          setBtn('wellness', p.wellness !== false);
          setBtn('gym', p.gym === true);
          setBtn('finance', p.finance !== false);
        }

        // Render Active Courses
        const yrTitle = document.getElementById('academicYearTitle');
        if (yrTitle) yrTitle.textContent = `🩺 موديولات ${data.user?.academic_year || 'الفرقة الرابعة'} (${data.user?.semester || 'الترم الأول'})`;
        const modStack = document.getElementById('academicModulesList');
        if (modStack && data.user?.active_courses?.length > 0) {
          modStack.innerHTML = data.user.active_courses.map(c => `
            <div class="list-item">
              <div class="item-left">
                <span>🩺</span>
                <div>
                  <div class="item-title">[${c.code}] ${c.title}</div>
                  <div class="item-sub">${data.user?.academic_year || 'موديول أكاديمي'}</div>
                </div>
              </div>
              <span class="badge-pill">نشط</span>
            </div>
          `).join('');
        }

        // 2. Prayers (12h)
        if (data.prayers) {
          document.getElementById('p-fajr').textContent = data.prayers.fajr;
          document.getElementById('p-sunrise').textContent = data.prayers.sunrise;
          document.getElementById('p-dhuhr').textContent = data.prayers.dhuhr;
          document.getElementById('p-asr').textContent = data.prayers.asr;
          document.getElementById('p-maghrib').textContent = data.prayers.maghrib;
          document.getElementById('p-isha').textContent = data.prayers.isha;
        }

        // 3. Mindset Pulse
        if (data.mindset_pulse?.text) {
          document.getElementById('mindsetPulseText').innerHTML = data.mindset_pulse.text;
        }

        // 4. Study Progress & Ring
        const totalMins = data.study?.total_minutes || 0;
        const totalHours = (totalMins / 60).toFixed(1).replace('.0', '');
        document.getElementById('studyHoursText').textContent = totalHours + ' س';
        document.getElementById('studyMinsText').textContent = totalMins + ' دقيقة (' + (data.study?.total_pages || 0) + ' صفحة)';

        const circle = document.getElementById('studyRingCircle');
        const circumference = 2 * Math.PI * 56; // ~351.8
        const percent = Math.min(100, (totalMins / (data.study?.target_minutes || 180)) * 100);
        const offset = circumference - (percent / 100) * circumference;
        circle.style.strokeDashoffset = offset;

        // Module Breakdown
        const modEl = document.getElementById('moduleList');
        const breakdown = data.study?.module_breakdown || {};
        const modKeys = Object.keys(breakdown);
        if (modKeys.length > 0) {
          let modHtml = '';
          modKeys.forEach(k => {
            const m = breakdown[k];
            if (m > 0) {
              const p = Math.min(100, Math.round((m / 60) * 100));
              modHtml += \`
                <div class="module-item">
                  <div class="module-row"><span>\${k}</span><span>\${m} دقيقة</span></div>
                  <div class="bar-bg"><div class="bar-fill" style="width: \${p}%;"></div></div>
                </div>
              \`;
            }
          });
          modEl.innerHTML = modHtml || '<p style="font-size:0.75rem; color:#94a3b8;">ابدأ تسجيل جلسة مذاكرة بالفويس لتوثيق الساعات!</p>';
        }

        // 5. Tasks & Appointments
        document.getElementById('taskCountBadge').textContent = (data.tasks?.length || 0) + ' مهام';
        const hTaskList = document.getElementById('homeTasksList');
        const fTaskList = document.getElementById('tasksFullList');
        if (data.tasks && data.tasks.length > 0) {
          const taskHtml = data.tasks.map(t => \`
            <div class="list-item">
              <div class="item-left">
                <span>\${t.status === 'تم الإنجاز' || t.status === 'مكتملة' ? '✅' : '🟡'}</span>
                <div>
                  <div class="item-title">\${t.title}</div>
                  <div class="item-sub">\${t.category || 'عام'}</div>
                </div>
              </div>
              <span class="badge-pill">\${t.status}</span>
            </div>
          \`).join('');
          hTaskList.innerHTML = taskHtml;
          fTaskList.innerHTML = taskHtml;
        } else {
          hTaskList.innerHTML = '<p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">لا توجد مهام مسجلة اليوم.</p>';
          fTaskList.innerHTML = '<p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">لا توجد مهام مسجلة اليوم.</p>';
        }

        // Appointments (12h)
        const apptList = document.getElementById('appointmentsFullList');
        if (data.appointments && data.appointments.length > 0) {
          apptList.innerHTML = data.appointments.map(a => \`
            <div class="list-item">
              <div class="item-left">
                <span>🔔</span>
                <div>
                  <div class="item-title">\${a.title}</div>
                  <div class="item-sub">⏰ \${a.time12 || a.due_datetime}</div>
                </div>
              </div>
              <span class="badge-pill">موعد</span>
            </div>
          \`).join('');
        } else {
          apptList.innerHTML = '<p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">لا توجد مواعيد مسجلة.</p>';
        }

        // 6. Medical Quizzes
        const quizContainer = document.getElementById('medicalQuizzesContainer');
        if (data.medical_quizzes && data.medical_quizzes.length > 0) {
          quizContainer.innerHTML = data.medical_quizzes.map((q, idx) => \`
            <div class="interactive-card">
              <div class="quiz-course">🩺 [\${q.course_code || 'CAD402'}] • مستوى التثبيت: \${q.repetition_level || 0}/6</div>
              <div class="quiz-q">\${q.question}</div>
              <button class="btn-reveal" onclick="toggleReveal('ans-med-\${idx}')">💡 إظهار الإجابة والشرح السريري</button>
              <div class="quiz-answer-box" id="ans-med-\${idx}">
                <p><b>الإجابة النموذجية:</b> \${q.correct_answer || 'موضحة بالمرجع'}</p>
                \${q.explanation ? \`<p style="margin-top:4px;"><b>الشرح الطبي:</b> \${q.explanation}</p>\` : ''}
              </div>
            </div>
          \`).join('');
        } else {
          quizContainer.innerHTML = '<p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">✨ لا توجد أسئلة مسجلة حالياً. أرسل صورة سلايد أو فويس وسيتم توليد الكويز فوراً!</p>';
        }

        // 7. English Cards
        const engContainer = document.getElementById('englishCardsContainer');
        if (data.english_flashcards && data.english_flashcards.length > 0) {
          engContainer.innerHTML = data.english_flashcards.map((c, idx) => \`
            <div class="interactive-card">
              <div class="quiz-course">🗣️ مفردة متقدمة • مستوى التكرار: \${c.repetition_level || 0}/6</div>
              <div class="quiz-q" style="font-family:'Inter',sans-serif; direction:ltr; text-align:left;">\${c.term_or_sentence}</div>
              <button class="btn-reveal" onclick="toggleReveal('ans-eng-\${idx}')">🇪🇬 إظهار المعنى المصري والمثال</button>
              <div class="quiz-answer-box" id="ans-eng-\${idx}">
                <p><b>المعنى:</b> \${c.egyptian_translation || 'جاهز للمراجعة'}</p>
                \${c.example_sentence ? \`<p style="margin-top:4px; font-family:'Inter',sans-serif; direction:ltr; text-align:left;"><i>"\${c.example_sentence}"</i></p>\` : ''}
              </div>
            </div>
          \`).join('');
        } else {
          engContainer.innerHTML = '<p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">لا توجد بطاقات إنجليزية مسجلة بعد.</p>';
        }

        // 8. Finance
        document.getElementById('finIncome').textContent = (data.finance?.income || 0).toLocaleString() + ' ج.م';
        document.getElementById('finExpense').textContent = (data.finance?.expense || 0).toLocaleString() + ' ج.م';
        document.getElementById('finNet').textContent = (data.finance?.net || 0).toLocaleString() + ' ج.م';

        const finList = document.getElementById('financeTransactionsList');
        if (data.finance?.items && data.finance.items.length > 0) {
          finList.innerHTML = data.finance.items.map(f => \`
            <div class="list-item">
              <div class="item-left">
                <span>\${f.type === 'إيراد' ? '🟢' : '🔴'}</span>
                <div>
                  <div class="item-title">\${f.description || f.category || 'معاملة مالية'}</div>
                  <div class="item-sub">\${f.payment_method || 'خزنة شخصية'}</div>
                </div>
              </div>
              <span class="badge-pill" style="color:\${f.type === 'إيراد' ? '#34d399' : '#f87171'}">\${f.amount} ج.م</span>
            </div>
          \`).join('');
        } else {
          finList.innerHTML = '<p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">لا توجد حركات مالية مسجلة اليوم.</p>';
        }

        // 9. Worship & Quran
        const qList = document.getElementById('quranLogsList');
        if (data.worship?.quran && data.worship.quran.length > 0) {
          qList.innerHTML = data.worship.quran.map(q => \`
            <div class="list-item">
              <div class="item-left">
                <span>🕌</span>
                <div>
                  <div class="item-title">سورة \${q.surah_name}</div>
                  <div class="item-sub">\${q.session_type || 'مراجعة'} • \${'⭐'.repeat(q.quality_rating || 5)}</div>
                </div>
              </div>
              <span class="badge-pill">\${q.mastery_status || 'متقن'}</span>
            </div>
          \`).join('');
        } else {
          qList.innerHTML = '<p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">لم تسجل ورد قرآني اليوم.</p>';
        }

        document.getElementById('worshipSunan').textContent = (data.worship?.sunan_count || 0) + ' / 12 ركعة';
        document.getElementById('worshipDuha').textContent = data.worship?.duha ? '✅ تم بحمد الله' : '⚪ لم تُسجل';
        document.getElementById('worshipWitr').textContent = data.worship?.witr ? '✅ تم بحمد الله' : '⚪ لم تُسجل';

        // 10. Gym
        const gymList = document.getElementById('gymLogsList');
        if (data.gym && data.gym.length > 0) {
          gymList.innerHTML = data.gym.map(g => \`
            <div class="list-item">
              <div class="item-left">
                <span>🏋️</span>
                <div>
                  <div class="item-title">\${g.workout_type || 'تمرين عام'}</div>
                  <div class="item-sub">\${g.muscle_groups || 'كامل الجسم'}</div>
                </div>
              </div>
              <span class="badge-pill">\${g.duration_minutes || 45} د</span>
            </div>
          \`).join('');
        } else {
          gymList.innerHTML = '<p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">لم تسجل تمارين اليوم.</p>';
        }

        // 11. Wellness & Thoughts
        const wtList = document.getElementById('wellnessThoughtsList');
        let wtHtml = '';
        if (data.wellness && data.wellness.length > 0) {
          wtHtml += data.wellness.map(w => \`
            <div class="list-item">
              <div class="item-left">
                <span>🧠</span>
                <div>
                  <div class="item-title">حالة: \${w.emotional_state || 'مستقرة'} (⭐ \${w.mood_rating || 5}/5)</div>
                  <div class="item-sub">\${w.ai_therapeutic_feedback ? w.ai_therapeutic_feedback.slice(0, 80) + '...' : ''}</div>
                </div>
              </div>
            </div>
          \`).join('');
        }
        if (data.thoughts && data.thoughts.length > 0) {
          wtHtml += data.thoughts.map(th => \`
            <div class="list-item">
              <div class="item-left">
                <span>💡</span>
                <div>
                  <div class="item-title">"\${th.content}"</div>
                </div>
              </div>
            </div>
          \`).join('');
        }
        wtList.innerHTML = wtHtml || '<p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">لا توجد خواطر مسجلة اليوم.</p>';

      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'none';
      }
    }

    loadDashboardData();
  </script>
</body>
</html>
  `);
}
