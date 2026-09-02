const fs = require('fs');

let code = fs.readFileSync('./lib/ai_engine.js', 'utf8');

const targetSection = `    - 📚 المذاكرة: حول الساعات دائماً إلى دقائق في duration_minutes (ساعتين ➔ 120).
    - 🛡️ بروتوكول التعافي والنقاء (سوسو & بوبو) للأدمن حصراً:
4. 💬 الرد الحواري (conversational_reply):`;

const cleanSection = `    - 📚 المذاكرة: حول الساعات دائماً إلى دقائق في duration_minutes (ساعتين ➔ 120).
    - 🛡️ بروتوكول التعافي والنقاء (سوسو & بوبو) للأدمن حصراً:
      - إذا ذكر (سوسو) ➔ تعني الاستمناء / العادة السرية (soso).
      - إذا ذكر (بوبو) ➔ تعني مشاهدة الأفلام الإباحية (bobo).
      - إذا ذكر (سوسو وبوبو / الاتنين) ➔ type: "both".
      - إذا ذكر أنه فعل ذلك (انتكاسة / تعثر) ➔ اضبط data.purity_log = { "type": "soso"|"bobo"|"both", "is_relapse": true, "trigger": "المحفز إن ذكر كالسهر أو الفراغ أو السرير", "notes": "ملاحظات" }.
      - إذا ذكر أنه يواجه رغبة شديدة أو شهوة عالية ويريد النجدة والمساعدة ➔ اضبط data.purity_log = { "type": "soso"|"bobo"|"both", "is_urge": true, "trigger": "...", "notes": "..." }.
      - إذا ذكر أنه قاوم ونجح ومسك نفسه ➔ اضبط data.purity_log = { "type": "soso"|"bobo"|"both", "is_resisted": true, "trigger": "...", "notes": "..." }.
    - 🗣️ الإنجليزية ونصوص المحادثات (English AI Chat & Flashcards Engine):
      - ⚠️ قاعدة ذهبية: إذا أرسل الطالب نصاً إنجليزياً أو محادثة دارت بينه وبين ذكاء اصطناعي (AI Chat / English dialogue) أو جملاً ومفردات يريد حفظها ➔ قم فوراً بتفكيك الشات واستخراج من 2 إلى 6 بطاقات تعليمية عالية القيمة (High-Yield Idioms, Phrasal Verbs, Useful Sentences, Advanced Vocab) وضعها في data.english_flashcards.
      - لكل فلاش كارد:
        * term_or_sentence: الجملة أو المصطلح أو التعبير بالإنجليزي بسياق طبيعي وسلس.
        * egyptian_translation: المعنى والترجمة الدقيقة بالعامية المصرية السهلة ("الزتونة بالمصري").
        * example_sentence: مثال توضيحي إضافي للاستخدام.
        * category: "ai_chat".
\${dynamicSections}

3. ❓ المدخلات الناقصة (Missing Mandatory Details):
   - إذا قال فقط "ذاكرت" دون مادة أو مدة، أو "صليت" دون تحديد الفريضة، أو "صرفت" دون مبلغ ➔ اضبط needs_clarification: true، clarification_type ("study"|"prayer"|"finance"|"quran"|"gym")، وسؤال توضيحي ودود في clarification_question.

4. 💬 الرد الحواري (conversational_reply):`;

code = code.replace(targetSection, cleanSection);
fs.writeFileSync('./lib/ai_engine.js', code, 'utf8');
console.log('✅ Cleanly updated ai_engine.js with complete prompt rules and English chat engine');
