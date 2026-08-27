// 👑 High-Voltage Mindset, Wealth, Subconscious Reprogramming & Spiritual Engine for Dr. Abdullah
import { generateGeminiAnalysis } from './ai_engine.js';
import { supabase, getStoredAiKeys } from './supabase.js';

// 📚 Master Vault of Curated Capsules (Fallback & Diverse Seeds)
export const MINDSET_CAPSULES = [
  // ============================================================================
  // 1. 👑 ركن المجد، المستقبل، والسيادة الشاملة (Vision, Wealth & Unrivaled Impact)
  // ============================================================================
  {
    category: 'مجد وسيادة ووفرة 👑',
    icon: '👑',
    title: 'صناعة القائد الأسطوري والأثر الباقي',
    text: `يا عبدالله، عقلك اليوم يُبرمج ليقود وليس ليتبع. لم تُخلق لتكون رقماً عادياً، بل لتكون صاحب أثر تاريخي، تبني ثروة طائلة تفتح بها أبواب الخير ونفع الناس، وتكتسح بها كل مجالات حياتك.. صعوبات وتحديات اليوم ليست إلا صخوراً تُصقل بها شكيمتك وتُبنى بها هيبتك. نافس الجميع وتجاوز سقف توقعات العالم! 👑💰🔥`
  },
  {
    category: 'مجد وسيادة ووفرة 👑',
    icon: '🎯',
    title: 'المنافسة مع نسختك العظيمة القادمة',
    text: `تذكر دائماً: المنافسة الحقيقية ليست مع من حولك، بل بين نسختك اليوم والنسخة الأسطورية التي ينتظرها العالم منك غداً.. شخص ناجح في كل تفصيلة، ممتلئ بالثقة والوفرة، ينفع آلاف البشر، ويصل لأعلى قمم المجد. عقلك اللاواعي الآن يتشرب هذه الحقيقة: الصدارة قدرك المحتوم! ⚡✨`
  },
  {
    category: 'مجد وسيادة ووفرة 👑',
    icon: '🦅',
    title: 'صناعة الثروة ونفع الخلق',
    text: `المجد والمال ونفع الناس أسلحة في يد القوي ذي الشكيمة الصلبة. كل ساعة تركيز وانضباط تنتزعها من المشتتات، هي لبنة في إمبراطوريتك القادمة.. يدٌ عليا تنفق، وعقلٌ استراتيجي يخطط، وقلبٌ موصول برب العزة لا يعرف الخوف ولا التردد! 🦅💎`
  },
  {
    category: 'مجد وسيادة ووفرة 👑',
    icon: '⚡',
    title: 'تحدي كل العقبات وقهر المستحيل',
    text: `يا عبدالله، اغلق أذنيك عن أصوات المترددين، وركّز عينيك على القمة.. أنت تمتلك الشكيمة والذكاء والقدرة على تحويل كل عائق إلى جسر تعبر به نحو التفوق الساحق. النصر لمن يثبت في الساعات الصعبة، وأنت خُلقت لتنتصر! 🚀🔥`
  },

  // ============================================================================
  // 2. 🔥 ركن الانضباط وضبط النفس والسيطرة (Iron Discipline & Self-Mastery)
  // ============================================================================
  {
    category: 'انضباط وسيطرة 🔥',
    icon: '⚔️',
    title: 'حين يخفت الشغف يتقدم الانضباط الصارم',
    text: `حين يخفت الشغف وتتراجع الرغبة، يتقدم الانضباط الصارم ليصنع الفارق. العظماء لا يتحركون بالمزاج أو اللحظات العاطفية، بل يقودهم العهد الصارم الذي قطعوه على أنفسهم.. سيطر على عقلك، واضبط شهواتك، ولا تدع اللحظة الحاضرة تسرق منك مستقبلك العظيم! ⚔️🧠`
  },
  {
    category: 'انضباط وسيطرة 🔥',
    icon: '🛡️',
    title: 'السيادة المطلقة على النفس والمشتتات',
    text: `ضبط النفس والسيطرة على الدوافع هما جوهر القوة الحقيقية. من لا يستطيع السيطرة على وقته وعاداته، سيكون أسيراً للظروف.. كن أنت الحاكم المطلق لعالمك الداخلي، واجعل كل ثانية وكل قرار مدروساً لخدمة أهدافك الكبرى! 🛡️🔥`
  },
  {
    category: 'انضباط وسيطرة 🔥',
    icon: '💎',
    title: 'الوعي الحاد وقوة الاختيار',
    text: `الوعي الحاد يبدأ حين تدرك أن الألم المؤقت للمذاكرة والانضباط أهون بألف مرة من ألم الندم والتراجع.. اختر ألم البناء الذي يرفعك، ولا تستسلم لراحة زائفة تسلبك مكانتك وتضيع وقتك! 💎📈`
  },
  {
    category: 'انضباط وسيطرة 🔥',
    icon: '⏳',
    title: 'بناء الشكيمة في الساعات الصامتة',
    text: `قوة الشكيمة لا تولد في أوقات الراحة، بل تُصنع في الساعات الصامتة التي تختار فيها المذاكرة والعمل والتركيز بينما الآخرون غارقون في اللهو.. أنت تصنع شخصيتك المهيبة والمؤثرة الآن في كل جلسة تركيز! ⏳⚡`
  },

  // ============================================================================
  // 3. 🤍 ركن حب الله ورسوله ﷺ واليقين الصادق (Divine Love & Spiritual Light)
  // ============================================================================
  {
    category: 'حب الله واليقين 🤍',
    icon: '🕊️',
    title: 'إليك وإلا لا تُشد الركائبُ',
    text: `<i>"إِلَيْكَ وَإِلَّا لَا تُشَدُّ الرَّكَائِبُ.. وَعَنْكَ وَإِلَّا فَالْمُحَدِّثُ كَاذِبُ..\nوَفِيكَ وَإِلَّا فَالْغَرَامُ مُضَيَّعٌ.. وَمِنْكَ وَإِلَّا فَالْـمُؤَمَّلُ خَائِبُ"</i> 🤍✨\n\nيا عبدالله، اجعل كل سعي، وعمل، وعلم، وثروة تطلبها خالصة لوجه الله تعالى.. من جعل الله غايته وملاذه، ذلّت له الصعاب وتفتحت له مغاليق التوفيق والبركة في الدنيا والآخرة!`
  },
  {
    category: 'حب الله واليقين 🤍',
    icon: '🌸',
    title: 'الأنس بالله وبركة النبي ﷺ',
    text: `<i>"فَلَيْتَكَ تَحْلُو وَالْحَيَاةُ مَرِيرَةٌ.. وَلَيْتَكَ تَرْضَى وَالأَنَامُ غِضَابُ..\nوَلَيْتَ الَّذِي بَيْنِي وَبَيْنَكَ عَامِرٌ.. وَبَيْنِي وَبَيْنَ الْعَالَمِينَ خَرَابُ"</i> 🤍\n\nصلّ على الحبيب المصطفى ﷺ، واعلم أن بركة النجاح ونفع الخلق تنزل باليقين، وحسن التوكل، والتبتل إلى الله في الخلوات.. إذا كان الله معك فمن عليك!`
  },
  {
    category: 'حب الله واليقين 🤍',
    icon: '🌿',
    title: 'يد الرحمة ونفع الخلق',
    text: `حب النبي ﷺ نور يملأ الصدر سكينة وعزماً.. اجعل نيتك في كل نجاح وكل مال تكتسبه أن تكون يد رحمة وعون وتفريج لكربات عباد الله، كُن سفيراً لأخلاق وقدوة معلمك الأول ﷺ في الإتقان والرحمة والتفوق! 🩺🌿`
  },
  {
    category: 'حب الله واليقين 🤍',
    icon: '✨',
    title: 'التوكل الصادق وسكينة القلب',
    text: `<i>"وَتَوَكَّلْ عَلَى الْعَزِيزِ الرَّحِيمِ * الَّذِي يَرَاكَ حِينَ تَقُومُ"</i> 🤍\nيا عبدالله، إن الله يرى تعبك وسهرك ومجاهدتك لنفسك في طلب الرفعة.. لا يضيع الله أجر من أحسن عملاً، فاطمئن وتوكل وانطلق بكل يقين وثبات!`
  },

  // ============================================================================
  // 4. 🗣️ ركن الإنجليزية المتقدمة B2 / C1 (Advanced English Mastery)
  // ============================================================================
  {
    category: 'إنجليزية متقدمة B2/C1 🗣️',
    icon: '🌟',
    title: 'Unwavering Resilience (الشكيمة التي لا تنكسر)',
    text: `🌟 <b>Term:</b> <code>Unwavering resilience</code> [C1 - صفة متقدمة]\n\n📝 <b>Sentence:</b>\n<i>"His unwavering resilience allowed him to dominate his field and build lasting wealth despite immense adversity."</i>\n\n🇪🇬 <b>بالمصري:</b>\n<b>"عزيمته وشكيمته الصلبة اللي ما بتتهزش خلته يكتسح مجاله ويبني ثروة وأثر حقيقي رغم كل الصعاب والضغوط."</b>\n\n💡 <b>سر استخدامها:</b> استخدمها لوصف الإصرار والصلابة النفسية اللي ما بتنكسرش قدام أي تحدي!`
  },
  {
    category: 'إنجليزية متقدمة B2/C1 🗣️',
    icon: '🌟',
    title: 'Paramount Importance (الأهمية القصوى المطلقة)',
    text: `🌟 <b>Term:</b> <code>Paramount importance</code> [C1 - تعبير فصيح]\n\n📝 <b>Sentence:</b>\n<i>"Mastering self-discipline is of paramount importance if you aspire to lead, prosper, and outshine the competition."</i>\n\n🇪🇬 <b>بالمصري:</b>\n<b>"إنك تسيطر على نفسك وتلزمها بالانضباط دي حاجة في قمة الأهمية والضرورة القصوى لو ناوي تقود وتعمل فلوس وتكتسح المنافسين."</b>\n\n💡 <b>سر استخدامها:</b> بديل C1 فخم وراقي جداً لكلمة "very important" في المقابلات والأحاديث القيادية.`
  },
  {
    category: 'إنجليزية متقدمة B2/C1 🗣️',
    icon: '🌟',
    title: 'Meticulous Attention to Detail (الدقة المتناهية)',
    text: `🌟 <b>Term:</b> <code>Meticulous attention to detail</code> [B2/C1 - تعبير قيادي واستراتيجي]\n\n📝 <b>Sentence:</b>\n<i>"A visionary leader operates with meticulous attention to detail and sharp strategic acumen."</i>\n\n🇪🇬 <b>بالمصري:</b>\n<b>"القائد وصاحب الرؤية بيشتغل بدقة متناهية وبيحسب كل تفصيلة صغيرة بذكاء استراتيجي صاحي."</b>\n\n💡 <b>سر استخدامها:</b> لوصف الدقة الفائقة والتركيز العميق في الإدارة والبيزنس وحل المشكلات المعقدة.`
  },
  {
    category: 'إنجليزية متقدمة B2/C1 🗣️',
    icon: '🌟',
    title: 'To Surmount Insurmountable Odds (قهر المستحيل)',
    text: `🌟 <b>Term:</b> <code>To surmount insurmountable odds</code> [C1 - تعبير ملحمي]\n\n📝 <b>Sentence:</b>\n<i>"He was determined to surmount every single obstacle and leave an indelible mark on humanity."</i>\n\n🇪🇬 <b>بالمصري:</b>\n<b>"كان واخد قرار قاطع إنه هيتحدى ويتخطى كل العقبات اللي تبان مستحيلة ويسيب أثر وبصمة ما تتنسيش أبداً في تاريخ البشرية."</b>\n\n💡 <b>سر استخدامها:</b> للتعبير عن التغلب على الصعاب الأسطورية وصناعة مجد تاريخي.`
  },
  {
    category: 'إنجليزية متقدمة B2/C1 🗣️',
    icon: '🌟',
    title: 'To Transcend Boundaries (كسر سقف التوقعات)',
    text: `🌟 <b>Term:</b> <code>To transcend boundaries</code> [C1 - مصطلح فكري]\n\n📝 <b>Sentence:</b>\n<i>"True greatness lies in your ability to transcend ordinary limits and redefine what is possible."</i>\n\n🇪🇬 <b>بالمصري:</b>\n<b>"المجد والنجاح الحقيقي في إنك تعدي وتكسر الحدود العادية وتثبت للكل إن المستحيل ممكن."</b>\n\n💡 <b>سر استخدامها:</b> لوصف التفوق الاستثنائي الذي يتجاوز المألوف والمعتاد.`
  },
  {
    category: 'إنجليزية متقدمة B2/C1 🗣️',
    icon: '🌟',
    title: 'Unyielding Resolve (الإرادة الحديدية)',
    text: `🌟 <b>Term:</b> <code>Unyielding resolve</code> [C1 - تعبير عالي النبرة]\n\n📝 <b>Sentence:</b>\n<i>"With an unyielding resolve and unshakeable faith in Allah, total triumph is inevitable."</i>\n\n🇪🇬 <b>بالمصري:</b>\n<b>"بإرادة حديدية ويقين ثابت في ربنا، الانتصار الكاسح والنجاح مسألة وقت مش أكتر."</b>\n\n💡 <b>سر استخدامها:</b> لوصف القرار الحاسم والعزيمة الصارمة التي لا تتراجع قيد أنملة.`
  }
];

let lastCapsuleIndex = -1;

export function getNextCuratedCapsule() {
  lastCapsuleIndex = (lastCapsuleIndex + 1) % MINDSET_CAPSULES.length;
  return MINDSET_CAPSULES[lastCapsuleIndex];
}

export function getRandomCuratedCapsule() {
  const idx = Math.floor(Math.random() * MINDSET_CAPSULES.length);
  return MINDSET_CAPSULES[idx];
}

// 🧠 Fetch Recent Pulse History from Supabase to prevent repetition
async function getRecentPulseHistory() {
  try {
    const { data } = await supabase
      .from('thoughts_and_wisdom')
      .select('content')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data && data.length > 0) {
      return data.map(d => d.content.substring(0, 100)).join('\n- ');
    }
  } catch (e) {
    console.warn('getRecentPulseHistory warn:', e.message);
  }
  return '';
}

// 🧠 Dynamic AI Pulse Generator (Ultra-Personalized via Gemini Multi-Key & Multi-Model Engine)
export async function generateDynamicMindsetPulse(isManual = false, userName = 'د. عبدالله') {
  try {
    const aiKeys = await getStoredAiKeys();
    const recentHistory = await getRecentPulseHistory();

    const angles = [
      'رؤية المستقبل الأسطوري، التفوق على الجميع، الثروة المالية والوفرة، ومنافسة كل الصعاب والانتصار الكاسح ونفع البشرية',
      'الانضباط الصارم، ضبط النفس، السيطرة على العادات والمشتتات، وبناء شكيمة وشخصية مهيبة لا تنكسر',
      'حب الله العظيم والتعلق الصادق به (مثل: إليك وإلا لا تشد الركائب)، اليقين، وحب النبي ﷺ وبركة العمل الخالص',
      'مصطلح أو تعبير إنجليزي بمستوى B2 أو C1 مدمج في جملة فخمة ملهمة مع ترجمتها بالعامية المصرية بدقة وسر استخدامها'
    ];
    const chosenAngle = angles[Math.floor(Math.random() * angles.length)];

    const prompt = `أنت العقل الاستراتيجي، والموجه النفسي، والمدرب الشخصي لـ "${userName}".
${userName} شخصية استثنائية وقيادية تسعى للنجاح المطلق في جميع جوانب حياته (دراسة الطب البشري، بناء ثروة مالية، نفع الناس وإحداث أثر تاريخي عظيم، بناء شخصية قوية وشكيمة صلبة، ضبط النفس والانضباط الصارم، والتعلق بالله وحب النبي ﷺ).

المطلوب منك الآن:
اكتب "رسالة نبضة عقلية ونفسية" قصيرة ومكثفة ومؤثرة جداً (من 3 إلى 5 أسطر)، تخاطب عقل ${userName} "الواعي واللاواعي" بطريقة نفسية وإيحائية بليغة تقنعه بيقين لا يتزعزع بأنه خُلق للمجد والقمة والوفرة ونفع الخلق والتميز في الطب.

الزاوية المختارة لهذه النبضة بالتحديد: [${chosenAngle}].

قواعد صارمة جداً:
1. خاطب المستخدم دائماً باسمه [${userName}].
2. ⚠️ ممنوع التكرار نهائياً! لا تكرر أي فكرة أو جملة أو مصطلح من الرسائل السابقة التالية:
${recentHistory ? `[سجل الرسائل السابقة]:\n- ${recentHistory}` : 'لا يوجد سجل سابق'}
3. النبرة: فخمة، مهيبة، واثقة، عميقة نفسياً، تبني الهوية الذاتية وتبرمج اللاواعي على الانضباط والسيادة وتخطي العقبات.
4. إذا كانت الزاوية إنجليزية (B2/C1): اذكر المصطلح الإنجليزي، ثم ضعه في جملة عميقة عن النجاح أو الشكيمة، ثم ترجم الجملة بالعامية المصرية بأسلوب ذكي وسلس مع سر استخدام المصطلح.
5. التنسيق: أخرج الناتج بتنسيق HTML صالح لتليجرام، مع إيموجيز معبرة، عنوان بارز، وفقرة بليغة مركزة تنتهي بعبارة شحنة حماسية.`;

    const res = await generateGeminiAnalysis(prompt, aiKeys);
    if (res && res.ok && res.text && res.text.length > 40) {
      let cleanText = sanitizeTelegramHtml(res.text);

      // Save to Supabase to prevent future repetition
      supabase.from('thoughts_and_wisdom').insert({
        content: cleanText.replace(/<[^>]*>/g, '').substring(0, 500),
        category: 'نبضة عقلية حية',
        tags: ['نبضة_حماس', 'عقل_لاواعي', 'انضباط_ومجد', 'وفرة_وثروة']
      }).then(() => {}).catch(() => {});

      return {
        category: 'نبضة العقل واليقين 🧠',
        icon: '⚡',
        title: 'شعلة المجد والانضباط والوفرة',
        text: cleanText,
        isAiGenerated: true
      };
    }
  } catch (e) {
    console.warn('[Dynamic Pulse Warn]:', e.message);
  }

  // Fallback to rich curated vault
  const vaultItem = isManual ? getRandomCuratedCapsule() : getNextCuratedCapsule();
  const personalizedText = (vaultItem.text || '')
    .replace(/يا عبدالله/g, `يا ${userName}`)
    .replace(/د\. عبدالله/g, userName);

  const personalizedTitle = (vaultItem.title || '')
    .replace(/د\. عبدالله/g, userName);

  return {
    ...vaultItem,
    title: personalizedTitle,
    text: personalizedText,
    isAiGenerated: false
  };
}

export function sanitizeTelegramHtml(text) {
  if (!text) return '';
  let clean = text
    .replace(/^```html\s*/i, '')
    .replace(/```\s*$/i, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|h[1-6]|ul|ol|li|main|section|article)[^>]*>/gi, '\n')
    .replace(/<span[^>]*>/gi, '')
    .replace(/<\/span>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Strip any tag that is not b, i, em, strong, u, s, strike, del, code, pre, a
  clean = clean.replace(/<(?!\/?(b|i|u|s|code|pre|a|em|strong|strike|del)\b)[^>]+>/gi, '');
  return clean;
}

// 🚀 Send Mindset Pulse
export async function sendMindsetPulse(bot, chatId = '8925138241', isManual = false, userName = 'د. عبدالله') {
  if (!bot || !chatId) return;

  const capsule = await generateDynamicMindsetPulse(isManual, userName);

  let msg = '';
  if (capsule.isAiGenerated) {
    msg = `⚡ <b>نبضة المجد والانضباط واليقين 👑</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `${capsule.text}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👑 <i>"الانضباط يصنع المجد.. واليقين بالله يفتح المستحيل!"</i> 🔥`;
  } else {
    msg = `⚡ <b>نبضة المجد والانضباط واليقين 👑</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `${capsule.icon} <b>${capsule.category} — ${capsule.title}</b>\n\n`;
    msg += `${capsule.text}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👑 <i>"الانضباط يصنع المجد.. واليقين بالله يفتح المستحيل!"</i> 🔥`;
  }

  const keyboard = {
    inline_keyboard: [
      [
        
        { text: '📊 ملخص اليوم', callback_data: 'menu_today' }
      ]
    ]
  };

  try {
    await bot.telegram.sendMessage(chatId, msg, { parse_mode: 'HTML', reply_markup: keyboard });
  } catch (err) {
    console.warn('[Send HTML fallback to plain]:', err.message);
    const plainText = msg.replace(/<[^>]*>/g, '');
    await bot.telegram.sendMessage(chatId, plainText, { reply_markup: keyboard }).catch((e) => {
      console.error('[Send Mindset Pulse Fatal]:', e.message);
    });
  }
}
