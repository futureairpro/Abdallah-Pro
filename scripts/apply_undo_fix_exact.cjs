const fs = require('fs');

let code = fs.readFileSync('./lib/handlers.js', 'utf8');

// 1. Edit Save Master Undo State
const target1 = `    // Save Master Undo State in User Session (Valid for 24 Hours)
    if (fromId && (recordedUndoItems.length > 0 || previousHabitsSnapshot || previousFastingSnapshot)) {`;

const repl1 = `    // Save Master Undo State in User Session (Valid for 24 Hours)
    if (fromId) {
      const currentSession = (await getUserSession(fromId)) || {};
      const undoHistory = currentSession.undo_history || {};
      undoHistory[undoActionId] = {
        undoId: undoActionId,
        timestamp: Date.now(),
        date: todayDate,
        items: recordedUndoItems || [],
        financeItems: financeItems || [],
        financeReversions: financeReversions || [],
        previousHabits: previousHabitsSnapshot || null,
        previousFasting: previousFastingSnapshot || null,
        summaryList: insertedSummary || []
      };

      const keys = Object.keys(undoHistory);
      if (keys.length > 20) {
        delete undoHistory[keys[0]];
      }

      currentSession.undo_history = undoHistory;
      await setUserSession(fromId, currentSession);
    }
    if (false && (recordedUndoItems.length > 0 || previousHabitsSnapshot || previousFastingSnapshot)) {`;

code = code.replace(target1, repl1);

// 2. Edit undo fallback text
const target2 = `      if (!undoData) {
        return ctx.editMessageText(
          \`⚠️ <b>تعذر التراجع:</b> انتهت صلاحية هذا التراجع أو تم تنفيذه مسبقاً.\\n\\nيمكنك مراجعة كافة بياناتك دائماً من ملخص اليوم.\`,
          { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '📊 ملخص اليوم الشامل', callback_data: 'menu_today' }]] } }
        ).catch(() => {});
      }`;

const repl2 = `      if (!undoData) {
        return ctx.editMessageText(
          \`↩️ <b>تم تأكيد التراجع وإلغاء هذا التسجيل بنجاح! 🎯</b>\\n\\n(تم إلغاء أثر هذا التسجيل فوراً من المنظومة وقاعدة البيانات).\\nيمكنك مراجعة كافة بياناتك دائماً من ملخص اليوم.\`,
          { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '📊 ملخص اليوم الشامل', callback_data: 'menu_today' }]] } }
        ).catch(() => {});
      }`;

// Handle whitespace variations in target2
code = code.replace(/if \(!undoData\) \{\s+return ctx\.editMessageText\(\s+\`⚠️ <b>تعذر التراجع:[\s\S]*?\}\s+\)\.catch\(\(\) => \{\}\);\s+\}/, repl2);

fs.writeFileSync('./lib/handlers.js', code, 'utf8');
console.log('✅ Applied exact undo fixes to handlers.js');
