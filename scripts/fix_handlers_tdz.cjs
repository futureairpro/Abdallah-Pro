const fs = require('fs');

let code = fs.readFileSync('./lib/handlers.js', 'utf8');

// 1. Fix poll_answer
const badPollAnswerRegex = /bot\.on\('poll_answer', async \(ctx\) => \{[\s\S]*?async function handleRealtimeActivity/s;
const fixedPollAnswer = `bot.on('poll_answer', async (ctx) => {
    try {
      const pollAnswer = ctx.pollAnswer;
      if (!pollAnswer || !pollAnswer.poll_id || !Array.isArray(pollAnswer.option_ids) || pollAnswer.option_ids.length === 0) return;

      const pollId = pollAnswer.poll_id;
      const selectedIndex = pollAnswer.option_ids[0];
      const fromId = pollAnswer.user?.id || ADMIN_CHAT_ID;

      const result = await processStudentPollAnswer(pollId, selectedIndex, fromId);
      if (!result) return;

      if (result.isCorrect) {
        let msg = \`🎉 <b>إجابة ممتازة وصحيحة يا دكتور! 🩺✨ (+30 Doctor XP)</b>\\n\`;
        msg += \`━━━━━━━━━━━━━━━━━━━━━\\n\`;
        msg += \`🏆 <b>تمت ترقية السؤال إلى المرحلة:</b> \${result.nextLevel}/6 في نظام التكرار المتباعد.\\n\`;
        msg += \`⏰ <b>المراجعة القادمة:</b> \${new Date(result.nextDate).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'short' })}\\n\`;
        if (result.quiz?.explanation) {
          msg += \`\\n💡 <b>تريكة الراوند والشرح من الـ PDF:</b>\\n<i>\${result.quiz.explanation}</i>\`;
        }
        await bot.telegram.sendMessage(fromId, msg, { parse_mode: 'HTML' }).catch(() => {});
      } else {
        let msg = \`⚠️ <b>إجابة غير دقيقة يا دكتور.. لا بأس! 🩺</b>\\n\`;
        msg += \`━━━━━━━━━━━━━━━━━━━━━\\n\`;
        msg += \`📌 تم تثبيت هذا السؤال في قائمة المراجعة العاجلة لترسيخه في ذاكرتك.\\n\`;
        if (result.quiz?.explanation) {
          msg += \`\\n💡 <b>الشرح وتصحيح المفهوم من مذكرة الموديول:</b>\\n<i>\${result.quiz.explanation}</i>\`;
        }
        await bot.telegram.sendMessage(fromId, msg, { parse_mode: 'HTML' }).catch(() => {});
      }
    } catch (e) {
      console.warn('poll_answer handler warn:', e.message);
    }
  });

  // ==============================================================================
  // ⏱️ Live Real-time Activity & Commute Stopwatch Engine
  // ==============================================================================

  async function handleRealtimeActivity`;

code = code.replace(badPollAnswerRegex, fixedPollAnswer);

// 2. Fix keyboardRows placement in executeParsedLifeActions
const topExecuteRegex = /const undoActionId = `act_\${Date\.now\(\)}_\${Math\.random\(\)\.toString\(36\)\.substring\(2, 6\)}`;\s+let todayStudyTotalMinutes = 0;/;
code = code.replace(topExecuteRegex, `const undoActionId = \`act_\${Date.now()}_\${Math.random().toString(36).substring(2, 6)}\`;\n    const keyboardRows = [];\n    let todayStudyTotalMinutes = 0;`);

// 3. Remove duplicate declaration lower down
code = code.replace(/\n\s+const keyboardRows = \[\];\s+if \(financeItems\.length > 0\)/, `\n    if (financeItems.length > 0)`);

fs.writeFileSync('./lib/handlers.js', code, 'utf8');
console.log('✅ Handlers fixed cleanly!');
