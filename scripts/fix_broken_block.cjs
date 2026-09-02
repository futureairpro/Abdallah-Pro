const fs = require('fs');

let code = fs.readFileSync('./lib/handlers.js', 'utf8');

const regex = /if \(active\.type === 'prayer'\) \{[\s\S]*?\} else if \(active\.type === 'gym'\) \{/;

const fixedBlock = `if (active.type === 'prayer') {
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

code = code.replace(regex, fixedBlock);
fs.writeFileSync('./lib/handlers.js', code, 'utf8');
console.log('Fixed block successfully');
