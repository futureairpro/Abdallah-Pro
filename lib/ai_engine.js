// 🧠 Google AI Studio Gemini Multi-Key & Multi-Model Engine for Abdullah's Journey OS
import https from 'https';
import http from 'http';

// Modern Supported Gemini 3.x Models Fallback Hierarchy
export const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest'
];

// Helper: Download audio buffer from Telegram CDN
export async function downloadFileBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFileBuffer(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', err => reject(err));
    }).on('error', err => reject(err));
  });
}

// Helper: Extract and clean array of API Keys
export function extractApiKeys(keyInput) {
  if (!keyInput) return [];
  if (Array.isArray(keyInput)) return keyInput.filter(Boolean);
  return String(keyInput).split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);
}

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

// Low-level HTTP Request to Gemini REST API
export function sendGeminiRequest(modelName, apiKey, postData) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 25000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200 && parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
            resolve({ ok: true, data: parsed, text: parsed.candidates[0].content.parts[0].text });
          } else {
            const errObj = parsed.error || {};
            const isQuota = res.statusCode === 429 || errObj.code === 429 || errObj.status === 'RESOURCE_EXHAUSTED' || (errObj.message && errObj.message.includes('quota'));
            const isForbidden = res.statusCode === 403 || errObj.code === 403;
            resolve({ ok: false, isQuota, isForbidden, status: res.statusCode, error: errObj });
          }
        } catch (e) {
          resolve({ ok: false, isQuota: false, isForbidden: false, status: res.statusCode, error: { message: e.message, raw: data } });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, isQuota: false, status: 408, error: { message: 'Gemini request timeout' } });
    });

    req.on('error', (err) => resolve({ ok: false, isQuota: false, error: err }));
    req.write(postData);
    req.end();
  });
}

// JSON Clean & Deep Repair Extractor Helper
export function extractAndParseJson(rawText) {
  if (!rawText) return { summary_text: 'استجابة فارغة', data: {} };

  // 1. Direct try after removing markdown code blocks
  let clean = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch (e1) {
    // Continue to repair pipeline
  }

  // 2. Normalize typographic / curly quotes and special Unicode spaces
  let s = clean
    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, ' ');

  // Extract from first { to last }
  const firstBrace = s.indexOf('{');
  const lastBrace = s.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    s = s.substring(firstBrace, lastBrace + 1);
  } else if (firstBrace !== -1) {
    s = s.substring(firstBrace);
  }

  // Fix trailing commas before } or ]
  s = s.replace(/,\s*([\]}])/g, '$1');

  // Fix Arabic pseudo-values if any
  s = s.replace(/:\s*أو\s*null/gi, ': null')
       .replace(/:\s*رقم/gi, ': 0');

  try {
    return JSON.parse(s);
  } catch (e2) {
    // Continue to character-level scanner
  }

  // 3. Character-by-character scanner to escape raw newlines/tabs inside strings and auto-close
  let result = '';
  let inString = false;
  let isEscaped = false;
  const stack = [];

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (inString) {
      if (isEscaped) {
        result += ch;
        isEscaped = false;
      } else if (ch === '\\') {
        result += ch;
        isEscaped = true;
      } else if (ch === '"') {
        inString = false;
        result += ch;
      } else if (ch === '\n') {
        result += '\\n';
      } else if (ch === '\r') {
        result += '\\r';
      } else if (ch === '\t') {
        result += '\\t';
      } else if (ch.charCodeAt(0) < 32) {
        result += ' ';
      } else {
        result += ch;
      }
    } else {
      if (ch === '"') {
        inString = true;
        result += ch;
      } else {
        if (ch === '{') stack.push('}');
        else if (ch === '[') stack.push(']');
        else if (ch === '}' || ch === ']') {
          if (stack.length > 0 && stack[stack.length - 1] === ch) {
            stack.pop();
          }
        }
        result += ch;
      }
    }
  }

  if (inString) result += '"';
  result = result.replace(/,\s*$/, '');
  while (stack.length > 0) result += stack.pop();

  try {
    return JSON.parse(result);
  } catch (e3) {
    // 4. Safe fallback field extractor
    const summaryMatch = rawText.match(/"summary_text"\s*:\s*"([^"]+)"/);
    const transcriptionMatch = rawText.match(/"raw_transcription"\s*:\s*"([^"]+)"/);
    return {
      summary_text: summaryMatch ? summaryMatch[1] : 'تم استلام وتوثيق رسالتك بنجاح 🎯',
      data: {},
      raw_transcription: transcriptionMatch ? transcriptionMatch[1] : clean.slice(0, 300)
    };
  }
}

// ==============================================================================
// 🌟 1. Master 360° Life OS System Prompt
// ==============================================================================
export const LIFE_OS_SYSTEM_PROMPT = `أنت العقل المدبر والمدير التنفيذي والمستشار الشخصي لمنظومة "رحلة عبدالله" (Abdullah's Journey OS).
المستخدم هو "د. عبدالله" - طالب طب بشري في الفرقة الرابعة (الفصل الدراسي السابع - 450 درجة).
مهمتك: الاستماع للتسجيل الصوتي أو قراءة النص، واستخراج وتصنيف جميع الأنشطة بدقة تامة في صيغة JSON نقية ومباشرة.

قواعد مهمة جداً لإخراج الـ JSON:
1. يجب أن يكون الناتج JSON صالحاً بنسبة 100% بدون أي أخطاء.
2. ضع علامات تنصيص مزدوجة (Double Quotes) حول جميع المفاتيح والقيم النصية.
3. إذا احتوى النص على علامات تنصيص، قم بهروبها بـ \\" (مثال: \\"نص\\").
4. لا تضع أسطراً جديدة مباشرة داخل النصوص بدون \\n.
5. لا تترك فواصل زائدة (Trailing Commas).

قواعد تصنيف الأنشطة:
- 🗣️ الإنجليزية (english_flashcards): استخرج الكلمات والمصطلحات الإنجليزية وترجمتها بالعامية المصرية ومثال وسياق.
- 🩺 الكويزات الطبية (medical_quizzes): استخرج الأسئلة الطبية والإجابة والشرح وتريكة الراوند (doctor_pearl) والموديول (CAD402, PED401, RSD403, HVD404, SKL 7).
- 🕌 تذكيرات الصلاة (prayer_relative_reminders): مثل "فكرني بعد العصر بـ 30 دقيقة" -> prayer_name: "العصر", offset_minutes: 30.
- 💤 النوم والاستيقاظ (prayer_habits): استخراج wake_up_time, sleep_bedtime, sleep_hours.
- 🕌 الصلوات (prayer_habits): fajr, dhuhr, asr, maghrib, isha (حاضر بالمسجد / حاضر / قضاء), sunan_rawatib, adhkar_morning, adhkar_evening, qiyam_night.
- 📅 السكاشن (attendance): course_code, session_title, status (حضور / غياب), reason, makeup_plan.
- 🧠 الحالة النفسية (mental_wellness): mood_rating (1-5), stress_level, emotional_state, venting_content, ai_therapeutic_feedback.
- 🌙 الصيام (fasting_worship): fasting_type, fasting_completed, sunan_rawatib_count, duha_prayer_done, witr_prayer_done.
- 📚 المذاكرة (study): course_code, topic, session_type, duration_minutes, pages_covered, comprehension_rating, was_rescheduled, reschedule_reason, notes.
- 🏥 الحالات الإكلينيكية (clinical_case): course_code, title, chief_complaint, provisional_diagnosis, doctor_pearls.
- 📖 القرآن (quran): surah_name, from_page, to_page, pages_count, session_type, mastery_status, quality_rating.
- 🏋️‍♂️ الجيم (fitness_gym): workout_type, muscle_groups, duration_minutes, protein_grams, water_liters.
- 🎬 المحتوى (content_creation): title, platform, stage, script_content.
- 💼 الشغل (work_projects): project_name, task_description, revenue_generated, status.
- 🎯 المهام (tasks): title, category, target_duration_mins, status, priority.
- ⏰ المواعيد (appointments): title, due_datetime (YYYY-MM-DDTHH:mm:ss), remind_at.
- 💡 الخواطر (thoughts): content, category, tags.
- 🚀 تطوير الذات (self_development): title, category, key_takeaways.
- 💵 المالية (finance): type (مصروف / إيراد), amount (رقم), category, payment_method (خزنة شخصية / فودافون كاش / إنستا باي / بنك مصر), description.

هيكل الـ JSON المطلوب بدقة:
{
  "summary_text": "ملخص مشجع ومرتب لما تم توثيقه باللغة العربية مع إيموجي راقية",
  "data": {
    "date": null,
    "english_flashcards": [],
    "medical_quizzes": [],
    "prayer_relative_reminders": [],
    "prayer_habits": {
      "sleep_hours": 0,
      "wake_up_time": null,
      "sleep_bedtime": null,
      "fajr": null,
      "dhuhr": null,
      "asr": null,
      "maghrib": null,
      "isha": null,
      "qiyam_night": null,
      "sunan_rawatib": null,
      "adhkar_morning": null,
      "adhkar_evening": null,
      "workout_done": null,
      "energy_level": null
    },
    "attendance": [],
    "mental_wellness": null,
    "fasting_worship": null,
    "study": [],
    "clinical_case": null,
    "quran": [],
    "fitness_gym": [],
    "content_creation": [],
    "work_projects": [],
    "tasks": [],
    "appointments": [],
    "thoughts": [],
    "self_development": [],
    "finance": []
  },
  "raw_transcription": "التفريغ الحرفي للكلام"
}`;

export async function parseWithGeminiPool(input, keyInput, isAudio = false) {
  const keys = extractApiKeys(keyInput);
  if (keys.length === 0) throw new Error('مفاتيح Gemini غير متوفرة');

  const parts = [];
  if (isAudio) {
    const base64Audio = Buffer.isBuffer(input) ? input.toString('base64') : Buffer.from(input).toString('base64');
    parts.push({ text: LIFE_OS_SYSTEM_PROMPT });
    parts.push({
      inline_data: {
        mime_type: 'audio/ogg',
        data: base64Audio
      }
    });
  } else {
    parts.push({ text: `${LIFE_OS_SYSTEM_PROMPT}\n\nنص رسالة د. عبدالله:\n"${input}"` });
  }

  const postData = JSON.stringify({
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.15,
      response_mime_type: 'application/json'
    }
  });

  let lastError = null;
  for (const currentKey of keys) {
    for (const model of GEMINI_MODELS) {
      const res = await sendGeminiRequest(model, currentKey, postData);
      if (res.ok) return extractAndParseJson(res.text);
      lastError = res.error?.message || `Error ${res.status}`;
      if (res.isQuota || res.isForbidden) continue;
    }
  }

  await sleep(1500);
  for (const currentKey of keys) {
    const retryRes = await sendGeminiRequest('gemini-flash-lite-latest', currentKey, postData);
    if (retryRes.ok) return extractAndParseJson(retryRes.text);
  }

  throw new Error(`تعذر معالجة الطلب مؤقتاً: ${lastError}`);
}

export const ENGLISH_COACH_PROMPT = `You are "Abdullah's Elite English Mentor & Medical Colleague".
Abdullah is a high-achieving 4th-year medical student striving for native-like fluency, sophisticated vocabulary, and seamless medical English communication.

Output strictly pure JSON:
{
  "conversational_reply": "Your English reply here...",
  "corrections": [
    { "original": "...", "corrected": "...", "reason": "..." }
  ],
  "elevated_vocabulary": [
    { "word": "...", "definition": "...", "example": "..." }
  ],
  "fluency_score": 88
}`;

export async function talkWithEnglishCoach(input, keyInput, isAudio = false) {
  const keys = extractApiKeys(keyInput);
  if (keys.length === 0) throw new Error('مفاتيح Gemini غير متوفرة');

  const parts = [];
  if (isAudio) {
    const base64Audio = Buffer.isBuffer(input) ? input.toString('base64') : Buffer.from(input).toString('base64');
    parts.push({ text: ENGLISH_COACH_PROMPT });
    parts.push({ inline_data: { mime_type: 'audio/ogg', data: base64Audio } });
  } else {
    parts.push({ text: `${ENGLISH_COACH_PROMPT}\n\nAbdullah's message:\n"${input}"` });
  }

  const postData = JSON.stringify({
    contents: [{ parts }],
    generationConfig: { temperature: 0.3, response_mime_type: 'application/json' }
  });

  for (const key of keys) {
    for (const model of GEMINI_MODELS) {
      const res = await sendGeminiRequest(model, key, postData);
      if (res.ok) return extractAndParseJson(res.text);
    }
  }
  throw new Error('تعذر تشغيل مدرب الإنجليزية حالياً.');
}

export async function generateMedicalQuiz(moduleCode, topic, keyInput) {
  const keys = extractApiKeys(keyInput);
  if (keys.length === 0) throw new Error('مفاتيح Gemini غير متوفرة');

  const prompt = `أنت أستاذ طب بشري إكلينيكي ممتاز في مصر والـ USMLE.
قم بإنشاء حالة سريرية ذكية وسؤال تفاعلي (Clinical Case MCQ + OSCE Checklist) لـ د. عبدالله في موديول: ${moduleCode || 'CAD402 / PED401'} في موضوع: ${topic || 'High-Yield Clinical Pearls'}.
أخرج النتيجة بصيغة JSON نقية:
{
  "case_scenario": "وصف شيق لحالة مريض...",
  "question": "السؤال الإكلينيكي...",
  "options": ["A) الاختيار الأول", "B) الاختيار الثاني", "C) الاختيار الثالث", "D) الاختيار الرابع"],
  "correct_option_index": 0,
  "explanation": "شرح طبي تفصيلي",
  "osce_tip": "نصيحة ذهبية لفحص هذا المريض في امتحان العملي"
}`;

  const postData = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, response_mime_type: 'application/json' }
  });

  for (const key of keys) {
    for (const model of GEMINI_MODELS) {
      const res = await sendGeminiRequest(model, key, postData);
      if (res.ok) return extractAndParseJson(res.text);
    }
  }
  throw new Error('تعذر توليد الكويز الطبي حالياً.');
}

export async function analyzeImageWithGemini(photoBuffer, keyInput, customCaption = '') {
  const keys = extractApiKeys(keyInput);
  if (keys.length === 0) throw new Error('مفاتيح Gemini غير متوفرة');

  const base64Image = photoBuffer.toString('base64');
  
  const visionPrompt = `أنت نظام الرؤية والذكاء الاصطناعي الطبي لمنظومة "رحلة عبدالله" (طالب طب بشري - الفرقة الرابعة).
افحص محتوى الصورة المرفقة بدقة بالغة:
${customCaption ? `ملاحظة المستخدم المرفقة مع الصورة: "${customCaption}"` : 'ملاحظة: المستخدم أرسل الصورة مباشرة دون كتابة أي تعليق.'}

مهمتك:
1. إذا كانت الصورة عبارة عن (سؤال طبي MCQ / حالة سريرية / سؤال ومعه إجابته وشرحه / خطأ في امتحان أو QBank):
   - صنفها كـ "medical_quiz".
   - استخرج نص السؤال كاملاً، الاختيارات، الإجابة الصحيحة مع الشرح الوافي، وحدد كود الموديول (CAD402, PED401, RSD403, HVD404, SKL 7)، وتريكة الراوند / الـ High-Yield Pearl.
2. إذا كانت الصورة عبارة عن (جملة أو كلمة إنجليزية / تعبير اصطلاحي Idiom / سكرين شوت من فيديو أو كورس):
   - صنفها كـ "english_flashcard".
   - استخرج المصطلح أو الجملة الإنجليزية بدقة، وترجمها للعامية المصرية الدارجة السلسة، وضع مثالاً توضيحياً وسياق الاستخدام.
3. إذا كانت سلايد شرح أو ملخص طبي عام:
   - صنفها كـ "medical_note" واستخرج أهم النقاط المركزة.

أخرج النتيجة بصيغة JSON نقية ومباشرة كالتالي:
{
  "detected_type": "medical_quiz" أو "english_flashcard" أو "medical_note",
  "summary_title": "عنوان موجز مع إيموجي",
  "medical_quiz": {
    "course_code": "CAD402" أو "PED401" أو "RSD403" أو "HVD404" أو "SKL 7",
    "topic": "الموضوع الطبي",
    "question": "نص السؤال كاملاً",
    "answer_and_explanation": "الإجابة النموذجية مع الشرح الوافي",
    "doctor_pearl": "تريكة إكلينيكية هامة مستخرجة من الشرح إن وجدت"
  },
  "english_flashcard": {
    "term_or_sentence": "النص الإنجليزي",
    "egyptian_translation": "الترجمة بالمصري الدارج",
    "example_sentence": "مثال توضيحي بالإنجليزية",
    "usage_context": "طبي / محادثة عامة"
  },
  "general_summary": "تلخيص منظم ومرتب للمستند أو السلايد"
}`;

  const postData = JSON.stringify({
    contents: [{
      parts: [
        { text: visionPrompt },
        { inline_data: { mime_type: 'image/jpeg', data: base64Image } }
      ]
    }],
    generationConfig: { temperature: 0.1, response_mime_type: 'application/json' }
  });

  for (const key of keys) {
    for (const model of GEMINI_MODELS) {
      const res = await sendGeminiRequest(model, key, postData);
      if (res.ok) return extractAndParseJson(res.text);
    }
  }
  throw new Error('تعذر قراءة الصورة بالذكاء الاصطناعي.');
}
