const fs = require('fs');

let code = fs.readFileSync('./lib/ai_engine.js', 'utf8');

const badChunkRegex = /if \(isAudio\) \{[\s\S]*?const slots = getBalancedSlots\(keys, GEMINI_MODELS\);/;

const cleanChunk = `if (isAudio) {
    const base64Audio = Buffer.isBuffer(input) ? input.toString('base64') : Buffer.from(input).toString('base64');
    parts.push({ text: systemPrompt });
    parts.push({
      inline_data: {
        mime_type: 'audio/ogg',
        data: base64Audio
      }
    });
  } else {
    let extraDirective = '';
    const englishWordMatches = typeof input === 'string' ? (input.match(/[a-zA-Z]{3,}/g) || []) : [];
    if (englishWordMatches.length >= 4) {
      extraDirective = '\\n\\n💡 توجيه إلزامي: هذا النص يحتوي على جمل ومحادثة باللغة الإنجليزية تعرض لها الطالب اليوم. استخرج من 2 إلى 6 بطاقات تعليمية عالية القيمة (High-Yield English Flashcards: Idioms, Useful Sentences, Advanced Vocab) وضعها في data.english_flashcards مع ترجمتها بالعامية المصرية السهلة لجدولتها بنظام التكرار المتباعد.';
    }
    parts.push({ text: \`\${systemPrompt}\\n\\nنص رسالة \${studentName}:\\n"\${input}"\${extraDirective}\` });
  }

  const postData = JSON.stringify({
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.15,
      maxOutputTokens: 900,
      response_mime_type: 'application/json'
    }
  });

  const slots = getBalancedSlots(keys, GEMINI_MODELS);`;

code = code.replace(badChunkRegex, cleanChunk);
fs.writeFileSync('./lib/ai_engine.js', code, 'utf8');
console.log('✅ Fixed parseWithGeminiPool cleanly!');
