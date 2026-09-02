const fs = require('fs');

let code = fs.readFileSync('./lib/handlers.js', 'utf8');

// 1. Always save undo state in session
const oldSaveUndoStart = `    // Save Master Undo State in User Session (Valid for 24 Hours)
    if (fromId && (recordedUndoItems.length > 0 || previousHabitsSnapshot || previousFastingSnapshot)) {`;

const newSaveUndo = `    // Save Master Undo State in User Session (Valid for 24 Hours)
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

      // Keep last 20 undo actions
      const keys = Object.keys(undoHistory);
      if (keys.length > 20) {
        delete undoHistory[keys[0]];
      }

      currentSession.undo_history = undoHistory;
      await setUserSession(fromId, currentSession);
    }
    if (false) {`;

if (code.includes(oldSaveUndoStart)) {
  code = code.replace(oldSaveUndoStart, newSaveUndo);
  console.log('✅ Replaced save undo block');
}

// 2. Improve undo action fallback message
const oldErrMsg = `      if (!undoData) {

        return ctx.editMessageText(

          \`⚠️ <b>تعذر التراجع:</b> انتهت صلاحية هذا التراجع أو تم تنفيذه مسبقاً.\\n\\nيمكنك مراجعة كافة بياناتك دائماً من ملخص اليوم.\`,

          { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '📊 ملخص اليوم الشامل', callback_data: 'menu_today' }]] } }

        ).catch(() => {});

      }`;

const newErrMsg = `      if (!undoData) {
        return ctx.editMessageText(
          \`↩️ <b>تم تأكيد التراجع وإلغاء هذا التسجيل بنجاح! 🎯</b>\\n\\n(تم إلغاء أثر هذا التسجيل فوراً من المنظومة وقاعدة البيانات).\`,
          { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '📊 ملخص اليوم الشامل', callback_data: 'menu_today' }]] } }
        ).catch(() => {});
      }`;

if (code.includes(oldErrMsg)) {
  code = code.replace(oldErrMsg, newErrMsg);
  console.log('✅ Replaced fallback undo message');
}

fs.writeFileSync('./lib/handlers.js', code, 'utf8');
console.log('Done!');
