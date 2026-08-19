// 📱 Telegram Mini App (Web App) Dashboard for Abdullah's Journey & Medical OS
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  return res.status(200).send(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>منظومة الطبيب الذكية | لوحة التحكم</title>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #07090e;
      --card-bg: rgba(15, 23, 42, 0.75);
      --card-border: rgba(56, 189, 248, 0.15);
      --primary: #38bdf8;
      --primary-glow: rgba(56, 189, 248, 0.3);
      --accent: #10b981;
      --accent-glow: rgba(16, 185, 129, 0.25);
      --gold: #fbbf24;
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', system-ui, sans-serif; -webkit-tap-highlight-color: transparent; }
    body { background: var(--bg); color: var(--text); min-height: 100vh; padding: 16px; padding-bottom: 80px; overflow-x: hidden; }
    
    /* Background subtle ambient lights */
    body::before {
      content: ''; position: fixed; top: -100px; left: -100px; width: 300px; height: 300px;
      background: radial-gradient(circle, var(--primary-glow) 0%, transparent 70%); z-index: -1; pointer-events: none;
    }
    body::after {
      content: ''; position: fixed; bottom: -100px; right: -100px; width: 300px; height: 300px;
      background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%); z-index: -1; pointer-events: none;
    }

    /* Header Profile Card */
    .header-card {
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: 18px 20px;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(12px);
    }
    .user-info { display: flex; align-items: center; gap: 14px; }
    .avatar {
      width: 48px; height: 48px; border-radius: 14px;
      background: linear-gradient(135deg, #0284c7, #0369a1);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; box-shadow: 0 4px 15px var(--primary-glow);
    }
    .user-text h1 { font-size: 1.1rem; font-weight: 800; color: #fff; line-height: 1.3; }
    .user-text span { font-size: 0.8rem; color: var(--text-muted); }
    .badge-sub {
      font-size: 0.75rem; font-weight: 700; padding: 6px 12px; border-radius: 20px;
      background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);
    }

    /* Study Ring Card */
    .study-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 24px;
      padding: 22px;
      margin-bottom: 18px;
      text-align: center;
      backdrop-filter: blur(10px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    .study-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .study-header h2 { font-size: 1rem; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 8px; }
    
    .ring-container { position: relative; width: 140px; height: 140px; margin: 0 auto 16px; }
    .ring-svg { transform: rotate(-90deg); width: 140px; height: 140px; }
    .ring-bg { fill: none; stroke: rgba(255, 255, 255, 0.06); stroke-width: 12; }
    .ring-progress {
      fill: none; stroke: url(#studyGrad); stroke-width: 12; stroke-linecap: round;
      stroke-dasharray: 377; stroke-dashoffset: 377; transition: stroke-dashoffset 1s ease-out;
    }
    .ring-text {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      text-align: center;
    }
    .ring-text .hours { font-size: 1.6rem; font-weight: 900; color: #fff; line-height: 1; }
    .ring-text .label { font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; }

    /* Module Progress Bars */
    .modules-grid { display: grid; gap: 10px; margin-top: 14px; text-align: right; }
    .module-item { background: rgba(30, 41, 59, 0.4); border-radius: 12px; padding: 10px 14px; border: 1px solid rgba(255,255,255,0.05); }
    .module-top { display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700; margin-bottom: 6px; }
    .bar-bg { height: 6px; background: rgba(255, 255, 255, 0.08); border-radius: 10px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 10px; background: linear-gradient(90deg, #38bdf8, #818cf8); transition: width 0.8s ease; }

    /* Finance & Tasks Grid */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
    .mini-card {
      background: var(--card-bg); border: 1px solid var(--card-border);
      border-radius: 20px; padding: 16px; backdrop-filter: blur(10px);
    }
    .mini-card h3 { font-size: 0.85rem; color: var(--text-muted); font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
    .mini-card .val { font-size: 1.25rem; font-weight: 900; color: #fff; }
    .mini-card .sub { font-size: 0.75rem; color: #34d399; margin-top: 4px; }

    /* Section Headers */
    .section-title { font-size: 0.95rem; font-weight: 800; margin-bottom: 10px; color: #cbd5e1; display: flex; align-items: center; gap: 8px; }

    /* Tasks List */
    .tasks-list { display: grid; gap: 8px; margin-bottom: 18px; }
    .task-item {
      background: var(--card-bg); border: 1px solid var(--card-border);
      border-radius: 14px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between;
      font-size: 0.85rem; font-weight: 600;
    }
    .task-item.done { opacity: 0.6; text-decoration: line-through; }
    .task-tag { font-size: 0.7rem; padding: 3px 8px; border-radius: 6px; background: rgba(56, 189, 248, 0.1); color: var(--primary); }

    /* Habits Row */
    .habits-row {
      display: flex; justify-content: space-around; background: var(--card-bg); border: 1px solid var(--card-border);
      border-radius: 20px; padding: 14px; margin-bottom: 18px;
    }
    .habit-col { text-align: center; font-size: 0.75rem; }
    .habit-icon {
      width: 38px; height: 38px; border-radius: 12px; background: rgba(255, 255, 255, 0.05);
      display: flex; align-items: center; justify-content: center; font-size: 18px; margin: 0 auto 6px;
    }
    .habit-icon.active { background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; }

    /* Floating Action Bar */
    .bottom-bar {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(16px);
      border-top: 1px solid var(--card-border); padding: 12px 20px;
      display: flex; justify-content: space-around; z-index: 100;
    }
    .btn-action {
      background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff;
      border: none; padding: 10px 20px; border-radius: 12px; font-weight: 800; font-size: 0.85rem;
      cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 15px var(--primary-glow);
    }

    .loader { text-align: center; padding: 40px; font-size: 1.1rem; color: var(--primary); }
  </style>
</head>
<body>

  <div id="loading" class="loader">
    ⏳ جاري تحميل إحصائيات منظومتك الذكية...
  </div>

  <div id="content" style="display: none;">
    <!-- Top Header -->
    <div class="header-card">
      <div class="user-info">
        <div class="avatar">🩺</div>
        <div class="user-text">
          <h1 id="user-name">دكتور زميل</h1>
          <span>الفرقة الرابعة | الفصل الدراسي السابع</span>
        </div>
      </div>
      <div id="sub-badge" class="badge-sub">🟢 نشط</div>
    </div>

    <!-- Study Hours Ring Card -->
    <div class="study-card">
      <div class="study-header">
        <h2>🩺 مذاكرة الطب اليوم</h2>
        <span id="target-label" style="font-size: 0.8rem; color: var(--text-muted);">الهدف: 3 ساعات</span>
      </div>

      <div class="ring-container">
        <svg class="ring-svg" viewBox="0 0 140 140">
          <defs>
            <linearGradient id="studyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#38bdf8" />
              <stop offset="100%" stop-color="#34d399" />
            </linearGradient>
          </defs>
          <circle class="ring-bg" cx="70" cy="70" r="60"></circle>
          <circle id="ring-progress" class="ring-progress" cx="70" cy="70" r="60"></circle>
        </svg>
        <div class="ring-text">
          <div id="study-hours" class="hours">0.0</div>
          <div class="label">ساعة</div>
        </div>
      </div>

      <div class="modules-grid" id="modules-list">
        <!-- Module bars injected here -->
      </div>
    </div>

    <!-- Finance & Tasks Quick Stats -->
    <div class="grid-2">
      <div class="mini-card">
        <h3>💵 المصروفات اليوم</h3>
        <div class="val" id="expense-val">0 ج.م</div>
        <div class="sub" id="net-val">الصافي: 0 ج.م</div>
      </div>
      <div class="mini-card">
        <h3>🎯 المهام المنجزة</h3>
        <div class="val" id="tasks-val">0 / 0</div>
        <div class="sub" id="tasks-pct">0% إنجاز</div>
      </div>
    </div>

    <!-- Worship & Habits -->
    <div class="section-title">🌙 ورد العبادات والأذكار اليومية</div>
    <div class="habits-row">
      <div class="habit-col">
        <div class="habit-icon" id="h-morning">🌅</div>
        <span>أذكار الصباح</span>
      </div>
      <div class="habit-col">
        <div class="habit-icon" id="h-evening">🌇</div>
        <span>أذكار المساء</span>
      </div>
      <div class="habit-col">
        <div class="habit-icon" id="h-duha">☀️</div>
        <span>الضحى</span>
      </div>
      <div class="habit-col">
        <div class="habit-icon" id="h-witr">🌌</div>
        <span>الوتر</span>
      </div>
      <div class="habit-col">
        <div class="habit-icon" id="h-quran">📖</div>
        <span>ورد القرآن</span>
      </div>
    </div>

    <!-- Daily Tasks -->
    <div class="section-title">🎯 قائمة المهام اليومية</div>
    <div class="tasks-list" id="tasks-list">
      <div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 10px;">لا توجد مهام مسجلة اليوم.</div>
    </div>
  </div>

  <!-- Bottom Floating Bar -->
  <div class="bottom-bar">
    <button class="btn-action" onclick="closeWebApp()">
      <span>💬 العودة للشات الصوتي</span>
    </button>
  </div>

  <script>
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }

    const userId = tg?.initDataUnsafe?.user?.id || '1191760477';
    const userNameParam = tg?.initDataUnsafe?.user?.first_name || '';

    async function loadDashboard() {
      try {
        const res = await fetch('/api/dashboard_data?telegram_id=' + userId);
        const data = await res.json();

        if (!data.ok) throw new Error(data.error || 'Failed');

        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').style.display = 'block';

        // 1. User Header
        document.getElementById('user-name').innerText = data.user.full_name || userNameParam || 'دكتور زميل';
        const subBadge = document.getElementById('sub-badge');
        if (data.user.subscription_status === 'lifetime') {
          subBadge.innerText = '👑 دائم (مدير)';
        } else if (data.user.subscription_status === 'active') {
          subBadge.innerText = '🟢 مشترك (' + data.user.days_remaining + ' يوم)';
        } else {
          subBadge.innerText = '⏳ تجربة (' + data.user.days_remaining + ' يوم)';
        }

        // 2. Study Ring
        const totalMins = data.study.total_minutes || 0;
        const totalHours = (totalMins / 60).toFixed(1);
        document.getElementById('study-hours').innerText = totalHours;

        const maxMins = 180;
        const pct = Math.min(100, Math.round((totalMins / maxMins) * 100));
        const ring = document.getElementById('ring-progress');
        const circumference = 377; // 2 * PI * 60
        const offset = circumference - (pct / 100) * circumference;
        ring.style.strokeDashoffset = offset;

        // 3. Module Breakdown
        const modulesList = document.getElementById('modules-list');
        modulesList.innerHTML = '';
        const modules = data.study.module_breakdown || {};
        const moduleNames = {
          'CAD402': '🫀 كارديولوجي (CAD402)',
          'PED401': '👶 طب الأطفال (PED401)',
          'RSD403': '🫁 صدرية وتنفسي (RSD403)',
          'HVD404': '🩸 أوعية دموية (HVD404)',
          'SKL 7': '🔬 مهارات إكلينيكية (SKL 7)'
        };

        for (const [code, mins] of Object.entries(modules)) {
          if (mins > 0 || code in moduleNames) {
            const label = moduleNames[code] || code;
            const barPct = Math.min(100, Math.round((mins / 90) * 100));
            modulesList.innerHTML += \`
              <div class="module-item">
                <div class="module-top">
                  <span>\${label}</span>
                  <span style="color: var(--primary);">\${mins} دقيقة</span>
                </div>
                <div class="bar-bg">
                  <div class="bar-fill" style="width: \${barPct}%;"></div>
                </div>
              </div>
            \`;
          }
        }

        // 4. Finance
        document.getElementById('expense-val').innerText = (data.finance.expense || 0) + ' ج.م';
        document.getElementById('net-val').innerText = 'الصافي: ' + (data.finance.net || 0) + ' ج.م';

        // 5. Tasks
        const tasks = data.tasks || [];
        const completedTasks = tasks.filter(t => t.status === 'تم الإنجاز').length;
        document.getElementById('tasks-val').innerText = completedTasks + ' / ' + tasks.length;
        document.getElementById('tasks-pct').innerText = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) + '% إنجاز' : 'لا مهام';

        const tasksContainer = document.getElementById('tasks-list');
        if (tasks.length > 0) {
          tasksContainer.innerHTML = '';
          tasks.forEach(t => {
            const isDone = t.status === 'تم الإنجاز';
            tasksContainer.innerHTML += \`
              <div class="task-item \${isDone ? 'done' : ''}">
                <div>
                  <span style="margin-left: 8px;">\${isDone ? '✅' : '⚪'}</span>
                  <span>\${t.title}</span>
                </div>
                <span class="task-tag">\${t.category || 'مذاكرة'}</span>
              </div>
            \`;
          });
        }

        // 6. Habits
        if (data.worship.adhkar_morning) document.getElementById('h-morning').classList.add('active');
        if (data.worship.adhkar_evening) document.getElementById('h-evening').classList.add('active');
        if (data.worship.duha) document.getElementById('h-duha').classList.add('active');
        if (data.worship.witr) document.getElementById('h-witr').classList.add('active');
        if (data.worship.quran && data.worship.quran.length > 0) document.getElementById('h-quran').classList.add('active');

      } catch (err) {
        document.getElementById('loading').innerHTML = '⚠️ تعذر تحميل البيانات: ' + err.message;
      }
    }

    function closeWebApp() {
      if (tg) tg.close();
    }

    loadDashboard();
  </script>
</body>
</html>
  `);
}
