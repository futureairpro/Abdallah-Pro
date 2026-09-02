const fs = require('fs');

let schCode = fs.readFileSync('./lib/scheduler.js', 'utf8');

// 1. Replace the entire spaced quiz block in scheduler.js with full metadata parsing & dynamic header
const oldSpacedBlockRegex = /\/\/ 2\. 🧠 نظام التكرار المتباعد الذكي والكويزات السريرية[\s\S]*?\/\/ ============================================================================\s+\/\/ 3\. 🌙 القسم الإسلامي والعبادات/;

const newSpacedBlock = `// 2. 🧠 نظام التكرار المتباعد الذكي والكويزات التفاعلية (Spaced Repetition Engine)
  if (prefs.study !== false || isAdminUser) {
    try {
      const nowIso = new Date().toISOString();
      const { data: dueQuizzes, error } = await supabase
        .from('medical_spaced_quizzes')
        .select('*')
        .lte('next_review_at', nowIso)
        .eq('is_mastered', false)
        .order('next_review_at', { ascending: true })
        .limit(1);

      if (!error && dueQuizzes && dueQuizzes.length > 0) {
        const quiz = dueQuizzes[0];
        const isForThisUser = !quiz.topic || quiz.topic.includes(\`[UID:\${chatId}]\`) || !quiz.topic.includes('[UID:');

        if (isForThisUser) {
          const sentKey = \`spaced_quiz_\${quiz.id}_\${dateStr}_\${chatId}\`;
          if (!(await hasSent(sentKey, 4 * 3600 * 1000))) {
            await markSent(sentKey, 4 * 3600 * 1000);

            // Extract metadata from doctor_pearl if present
            let options = quiz.options;
            let correctIdx = Number(quiz.correct_option_index || 0);
            let explanation = quiz.explanation || quiz.answer_and_explanation || 'إجابة وشرح تثبيتي';
            let metaObj = {};

            if (quiz.doctor_pearl && quiz.doctor_pearl.includes('<<<QUIZ_META_START>>>')) {
              try {
                const jsonStr = quiz.doctor_pearl.split('<<<QUIZ_META_START>>>')[1].split('<<<QUIZ_META_END>>>')[0];
                metaObj = JSON.parse(jsonStr);
                if (metaObj.options && Array.isArray(metaObj.options) && metaObj.options.length >= 2) {
                  options = metaObj.options;
                }
                if (metaObj.correct_index !== undefined) correctIdx = Number(metaObj.correct_index);
                if (metaObj.explanation) explanation = metaObj.explanation;
              } catch (e) {}
            }

            // Clean Topic Text
            const cleanTopic = (quiz.topic || '')
              .replace(/\[UID:\d+\]/g, '')
              .replace(/\[usr:\d+\]/g, '')
              .trim();

            // Dynamic Header based on Course Code
            const course = String(quiz.course_code || 'MED').toUpperCase();
            let headerTitle = '🩺 <b>سؤال سريري للمراجعة والتثبيت:</b>';
            if (course === 'SHARIA') headerTitle = '📖 <b>سؤال الفقه والعلم الشرعي للتثبيت:</b>';
            else if (course === 'DISCIPLINE') headerTitle = '🧠 <b>سؤال علم الأعصاب والانضباط الذاتي:</b>';
            else if (course === 'QURAN_ASBAB') headerTitle = '💎 <b>سؤال أسباب النزول وتدبر القرآن:</b>';
            else if (course === 'BUKHARI') headerTitle = '📜 <b>سؤال درر صحيح البخاري والقيادة:</b>';
            else if (course === 'PROPHETIC_LEADERSHIP') headerTitle = '⚔️ <b>سؤال القيادة والاستراتيجية النبوية:</b>';
            else if (course === 'SAHABA_SPOTLIGHT') headerTitle = '🌟 <b>سؤال صحابي اليوم وصناعة القائد:</b>';
            else if (course === 'STATESMAN') headerTitle = '👑 <b>سؤال رجل الدولة والدروس التاريخية:</b>';
            else if (course === 'PURITY') headerTitle = '🛡️ <b>سؤال وقود النقاء والتميز الإيماني:</b>';

            // If options exist -> SEND NATIVE INTERACTIVE TELEGRAM QUIZ POLL!
            if (options && Array.isArray(options) && options.length >= 2) {
              const questionText = \`\${cleanTopic ? \`[\${cleanTopic}]\\n\` : ''}\${quiz.question}\`.substring(0, 300);
              const cleanOptions = options.map(o => String(o).substring(0, 100));
              const safeCorrectIdx = Math.max(0, Math.min(cleanOptions.length - 1, correctIdx));
              const safeExplanation = \`💡 \${explanation}\`.substring(0, 195);

              // 1. Send introductory header
              let intro = \`\${headerTitle}\\n━━━━━━━━━━━━━━━━━━━━━\\n\`;
              if (cleanTopic) intro += \`📌 <b>الموضوع:</b> <b>\${cleanTopic}</b>\\n\\n\`;
              intro += \`👇 <i>اختر الإجابة الصحيحة لتثبيت المعلومة بالذاكرة والحصول على (+30 Doctor XP):</i>\`;
              await bot.telegram.sendMessage(chatId, intro, { parse_mode: 'HTML' }).catch(() => {});

              // 2. Send Telegram Quiz Poll
              const pollMessage = await bot.telegram.sendPoll(chatId, questionText, cleanOptions, {
                type: 'quiz',
                correct_option_id: safeCorrectIdx,
                explanation: safeExplanation,
                is_anonymous: false
              }).catch(err => {
                console.warn('[SendPoll Error]:', err.message);
              });

              if (pollMessage?.poll?.id) {
                metaObj.poll_id = pollMessage.poll.id;
                metaObj.options = cleanOptions;
                metaObj.correct_index = safeCorrectIdx;
                metaObj.explanation = safeExplanation;

                await supabase.from('medical_spaced_quizzes').update({
                  telegram_poll_id: pollMessage.poll.id,
                  doctor_pearl: \`<<<QUIZ_META_START>>>\${JSON.stringify(metaObj)}<<<QUIZ_META_END>>> \${explanation}\`.trim()
                }).eq('id', quiz.id);
              }
            } else {
              // Fallback only if no multiple-choice options were stored
              let msg = \`\${headerTitle}\\n━━━━━━━━━━━━━━━━━━━━━\\n\`;
              if (cleanTopic) msg += \`📌 <b>الموضوع:</b> \${cleanTopic}\\n\\n\`;
              msg += \`❓ <b>السؤال:</b>\\n<b>\${quiz.question}</b>\\n\\n\`;
              msg += \`💡 <i>فكر في الإجابة ثم اضغط لإظهار الشرح والتثبيت:</i>\`;

              const keyboard = {
                inline_keyboard: [
                  [{ text: '💡 أظهر الإجابة النموذجية والشرح', callback_data: \`reveal_med_\${quiz.id}\` }]
                ]
              };

              await bot.telegram.sendMessage(chatId, msg, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
            }
          }
        }
      }
    } catch (e) {
      console.warn('[Scheduler Spaced Quiz Warn]:', e.message);
    }
  }

  // ============================================================================
  // 3. 🌙 القسم الإسلامي والعبادات`;

schCode = schCode.replace(oldSpacedBlockRegex, newSpacedBlock);
fs.writeFileSync('./lib/scheduler.js', schCode, 'utf8');
console.log('✅ Updated scheduler.js with dynamic headers, clean topics, and guaranteed interactive quiz polls');
