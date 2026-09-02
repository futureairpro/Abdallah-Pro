const fs = require('fs');

let code = fs.readFileSync('./lib/handlers.js', 'utf8');

// 1. Restore prayer / study in activity stopwatch handler
const badActivityBlock = `      if (active.type === 'prayer') {

        const studentName = ctx.userProfile?.full_name || (Number(fromId) === ADMIN_CHAT_ID ? 'دكتور عبدالله' : 'يا دكتور');
            : \`⏳ <b>متبقي على هدف الـ 3 ساعات:</b> <b>\${remainingHours} ساعة</b>.\`);

      } else if (active.type === 'gym') {`;

const fixedActivityBlock = `      if (active.type === 'prayer') {
        const studentName = ctx.userProfile?.full_name || (Number(fromId) === ADMIN_CHAT_ID ? 'دكتور عبدالله' : 'يا دكتور');
        replyMsg = \`🕌 <b>تقبل الله صلاتك وطاعتك يا \${studentName}! 🤍</b>\\n━━━━━━━━━━━━━━━━━━━━━\\n⏱️ <b>مدة رحلة الصلاة والمسجد:</b> <b>\${elapsedMins} دقيقة</b>\\n📍 تم تسجيل وقت الذهاب والإياب بنجاح لحساب أوقات انتقالك اليومية بدقة!\`;
      } else if (active.type === 'study') {
        const { data: pastSessions } = await supabase.from('study_sessions').select('duration_minutes').eq('date', today);
        let totalMins = elapsedMins;
        (pastSessions || []).forEach(s => totalMins += Number(s.duration_minutes || 0));

        await supabase.from('study_sessions').insert({
          course_code: active.course || 'CAD402',
          topic: \`[usr:\${fromId}] \${active.topic || 'جلسة مذاكرة وتركيز'}\`,
          duration_minutes: elapsedMins,
          session_type: 'مذاكرة مركزة (Deep Work)',
          date: today
        });

        const totalHours = (totalMins / 60).toFixed(1);
        const remainingHours = Math.max(0, 3 - (totalMins / 60)).toFixed(1);
        const isGoalAchieved = totalMins >= 180;

        replyMsg = \`📚 <b>عاش يا دكتور! تم توثيق جلسة المذاكرة بنجاح! 🎯</b>\\n━━━━━━━━━━━━━━━━━━━━━\\n⏱️ <b>مدة الجلسة:</b> <b>\${elapsedMins} دقيقة</b>\\n📊 <b>إجمالي مذاكرة اليوم:</b> <b>\${totalHours} / 3 ساعات</b>\\n\` +
          (isGoalAchieved 
            ? \`🎉 <b>ألف مبروك! حققت هدفك اليومي الأساسي (3 ساعات مذاكرة على الأقل)! 👑</b>\` 
            : \`⏳ <b>متبقي على هدف الـ 3 ساعات:</b> <b>\${remainingHours} ساعة</b>.\`);
      } else if (active.type === 'gym') {`;

code = code.replace(badActivityBlock, fixedActivityBlock);

// 2. Update flashcards handler to support all aliases
const oldFlashcardHandler = `    // 1. English Flashcards

    if (Array.isArray(data.english_flashcards) && data.english_flashcards.length > 0) {

      for (const card of data.english_flashcards) {

        try {

          if (card.term_or_sentence) {

            const nextReview = new Date(Date.now() + 12 * 3600 * 1000).toISOString();

            const { data: row } = await supabase.from('english_spaced_flashcards').insert({

              term_or_sentence: card.term_or_sentence,

              egyptian_translation: card.egyptian_translation || 'ترجمة مصرية دارجة',

              example_sentence: card.example_sentence || null,

              category: card.category || 'medical_daily',

              repetition_level: 0,

              next_review_at: nextReview

            }).select('id').maybeSingle();

            if (row?.id) {

              recordedUndoItems.push({ table: 'english_spaced_flashcards', id: row.id, summary: \`🗣️ فلاش كارد [\${card.term_or_sentence}]\` });

            }

            insertedSummary.push(\`🗣️ <b>فلاش كارد إنجليزي:</b> <code>\${card.term_or_sentence}</code>\\n   └ 🇪🇬 <b>المعنى:</b> \${card.egyptian_translation || 'جاهز للمراجعة'}\`);

          }

        } catch (e) {

          console.warn('english_flashcards insert error:', e.message);

        }

      }

    }`;

const newFlashcardHandler = `    // 1. English Flashcards
    if (Array.isArray(data.english_flashcards) && data.english_flashcards.length > 0) {
      for (const card of data.english_flashcards) {
        try {
          const term = card.term_or_sentence || card.term || card.phrase || card.sentence;
          const trans = card.egyptian_translation || card.definition || card.translation || 'ترجمة مصرية دارجة';
          const ex = card.example_sentence || card.example || null;

          if (term) {
            const nextReview = new Date(Date.now() + 12 * 3600 * 1000).toISOString();
            const { data: row } = await supabase.from('english_spaced_flashcards').insert({
              term_or_sentence: term,
              egyptian_translation: trans,
              example_sentence: ex,
              category: card.category || 'ai_chat',
              repetition_level: 0,
              next_review_at: nextReview
            }).select('id').maybeSingle();

            if (row?.id) {
              recordedUndoItems.push({ table: 'english_spaced_flashcards', id: row.id, summary: \`🗣️ فلاش كارد [\${term}]\` });
            }

            insertedSummary.push(\`🗣️ <b>فلاش كارد إنجليزي:</b> <code>\${term}</code>\\n   └ 🇪🇬 <b>المعنى:</b> \${trans}\`);
          }
        } catch (e) {
          console.warn('english_flashcards insert error:', e.message);
        }
      }
    }`;

code = code.replace(oldFlashcardHandler, newFlashcardHandler);
fs.writeFileSync('./lib/handlers.js', code, 'utf8');
console.log('✅ Handlers cleaned and updated successfully!');
