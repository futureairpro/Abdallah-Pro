const fs = require('fs');

// 1. UPDATE AI_ENGINE.JS
let aiCode = fs.readFileSync('./lib/ai_engine.js', 'utf8');

const oldGymNutritionSection = `  if (prefs.gym === true) {
    dynamicSections += \`
- 🏋️‍♂️ الجيم واللياقة: استخرج وقت التمرين بالدقائق، والعضلات المستهدفة وجرامات البروتين والماء في data.fitness_gym.
- 🥗 التغذية وحساب السعرات: استخرج أي أكل أو وجبات ذكرها مع تقدير السعرات (calories) والبروتين (protein_g) والكارب والدهون واسم الوجبة في data.nutrition.
- ⚖️ قياسات الجسم (InBody): إذا ذكر وزنه أو طوله أو نسبة دهونه استخرجها في data.body_metrics.\`;
  }`;

const newGymNutritionSection = `  if (prefs.gym === true) {
    dynamicSections += \`
- 🏋️‍♂️ الجيم واللياقة: استخرج وقت التمرين بالدقائق، والعضلات المستهدفة والتمارين في data.fitness_gym.
- ⚖️ قياسات الجسم (InBody): إذا ذكر وزنه أو طوله أو نسبة دهونه استخرجها في data.body_metrics.\`;
  }
  // 🥗 Always support smart nutrition, macros, and calorie calculation
  dynamicSections += \`
- 🥗 التغذية وحساب السعرات والماكروز (Macro & Calorie Intelligence):
  * استخرج كل وجبة أو طعام في data.nutrition:
    - meal_name: نص تفصيلي بالأطعمة والكميات (مثال: "200 جرام كبدة، علبة تونة مفتتة، مانجا عويس، كوباية لبن").
    - meal_type: نوع الوجبة بذكاء:
      * في الصباح (05:00 ص إلى 11:59 ص) أو بعد تمرين الفجر/الصباح ➔ "فطار" (أو "وجبة بعد التمرين").
      * بعد الظهر والعصر (12:00 م إلى 05:59 م) ➔ "غداء".
      * في المساء والليل (06:00 م إلى 04:59 ص) ➔ "عشاء" (أو "سناك").
    - calories: إجمالي السعرات التقريبية كرقم صحيح (⚠️ إلزامي تقديرها وحسابها بدقة وفق الجداول الغذائية، ولا تضع 0 أبداً إلا إذا كان ماء فقط).
    - protein_g: جرامات البروتين التقريبية كرقم صحيح (احسبها بناءً على اللحوم والتونة والكبدة والبيض واللبن والبقوليات).
    - carbs_g: جرامات الكاربوهيدرات التقريبية كرقم صحيح (الأرز، الخبز، الفواكه كالمانجا، الشوفان، العسل).
    - fats_g: جرامات الدهون التقريبية كرقم صحيح (الزيوت، صفار البيض، المكسرات، دهون اللحوم).
    - nutrition_pearl: نصيحة وتوجيه غذائي ذكي مختصر وعلمي.\`;`;

aiCode = aiCode.replace(oldGymNutritionSection, newGymNutritionSection);

// Update JSON schema in prompt
aiCode = aiCode.replace('"nutrition": [],', `"nutrition": [
      {
        "meal_name": "200 جرام كبدة، علبة تونة، مانجا عويس، كوب لبن",
        "meal_type": "فطار / بعد التمرين",
        "calories": 680,
        "protein_g": 75,
        "carbs_g": 55,
        "fats_g": 18,
        "nutrition_pearl": "وجبة غنية بالبروتين والحديد وفيتامين A ممتازة للاستشفاء العضلي بعد الجيم"
      }
    ],`);

fs.writeFileSync('./lib/ai_engine.js', aiCode, 'utf8');
console.log('✅ Updated ai_engine.js with smart nutrition & macro rules');

// 2. UPDATE HANDLERS.JS TO ADD SMART MACRO FALLBACK ESTIMATOR
let handlersCode = fs.readFileSync('./lib/handlers.js', 'utf8');

const oldNutritionHandler = `    // 19. 🥗 Nutrition Logs & Food Tracking
    if (Array.isArray(data.nutrition) && data.nutrition.length > 0) {
      for (const nut of data.nutrition) {
        try {
          if (nut.meal_name || nut.calories) {
            const savedMeal = await logNutritionMeal(fromId, {
              meal_name: nut.meal_name || 'وجبة طعام',
              meal_type: nut.meal_type || 'وجبة رئيسية',
              calories: Number(nut.calories || 0),
              protein_g: Number(nut.protein_g || 0),
              carbs_g: Number(nut.carbs_g || 0),
              fats_g: Number(nut.fats_g || 0),
              notes: nut.nutrition_pearl || nut.notes || null,
              date: todayDate
            });

            if (savedMeal?.id) {
              recordedUndoItems.push({ table: 'nutrition_logs', id: savedMeal.id, summary: \`🥗 وجبة [\${nut.meal_name || 'طعام'}]\` });
            }

            await addDoctorXp(fromId, 25, 'nutrition_pro');
            insertedSummary.push(\`🥗 <b>وجبة وتغذية:</b> <b>\${nut.meal_name || 'وجبة'}</b>\\n   └ ⚡ <b>السعرات:</b> ~\${nut.calories || 0} kcal | 🥩 <b>البروتين:</b> ~\${nut.protein_g || 0}g | 🍞 <b>كارب:</b> ~\${nut.carbs_g || 0}g | 🥑 <b>دهون:</b> ~\${nut.fats_g || 0}g\`);
          }
        } catch (e) {
          console.warn('nutrition insert error:', e.message);
        }
      }
    }`;

const newNutritionHandler = `    // 19. 🥗 Nutrition Logs & Food Tracking
    if (Array.isArray(data.nutrition) && data.nutrition.length > 0) {
      for (const nut of data.nutrition) {
        try {
          const rawName = nut.meal_name || (Array.isArray(nut.items) ? nut.items.join('، ') : 'وجبة طعام');
          
          // Smart Meal Type Auto-Classification based on Cairo Time if not specified or misclassified
          let resolvedMealType = nut.meal_type || 'وجبة';
          const cHour = new Date().getUTCHours() + 3; // Cairo UTC+3
          if (!nut.meal_type || nut.meal_type === 'غداء / وجبة' || nut.meal_type === 'وجبة رئيسية') {
            if (cHour >= 4 && cHour < 12) resolvedMealType = 'فطار / بعد التمرين 🍳';
            else if (cHour >= 12 && cHour < 18) resolvedMealType = 'غداء 🍲';
            else resolvedMealType = 'عشاء / سناك 🌙';
          }

          // Smart Macro Fallback Estimator if Gemini returned 0
          let cal = Number(nut.calories || 0);
          let prot = Number(nut.protein_g || 0);
          let carb = Number(nut.carbs_g || 0);
          let fat = Number(nut.fats_g || 0);

          if (cal === 0 && prot === 0) {
            const lower = rawName.toLowerCase();
            // Estimate based on common foods
            if (lower.includes('كبدة')) { cal += 280; prot += 42; carb += 8; fat += 9; }
            if (lower.includes('تونة')) { cal += 140; prot += 30; carb += 0; fat += 2; }
            if (lower.includes('مانجا') || lower.includes('مانجو')) { cal += 160; prot += 2; carb += 40; fat += 1; }
            if (lower.includes('لبن') || lower.includes('حليب')) { cal += 130; prot += 8; carb += 12; fat += 5; }
            if (lower.includes('بيض')) { cal += 150; prot += 13; carb += 1; fat += 10; }
            if (lower.includes('فراخ') || lower.includes('دجاج') || lower.includes('صدور')) { cal += 250; prot += 45; carb += 0; fat += 6; }
            if (lower.includes('رز') || lower.includes('أرز')) { cal += 200; prot += 4; carb += 45; fat += 1; }
            if (lower.includes('شوفان')) { cal += 180; prot += 6; carb += 32; fat += 3; }
            if (cal === 0) { cal = 350; prot = 20; carb = 30; fat = 10; } // Reasonable baseline
          }

          const savedMeal = await logNutritionMeal(fromId, {
            meal_name: rawName,
            meal_type: resolvedMealType,
            calories: cal,
            protein_g: prot,
            carbs_g: carb,
            fats_g: fat,
            notes: nut.nutrition_pearl || nut.notes || null,
            date: todayDate
          });

          if (savedMeal?.id) {
            recordedUndoItems.push({ table: 'nutrition_logs', id: savedMeal.id, summary: \`🥗 وجبة [\${rawName}]\` });
          }

          await addDoctorXp(fromId, 25, 'nutrition_pro');
          insertedSummary.push(\`🥗 <b>وجبة وتغذية:</b> <b>\${resolvedMealType}</b> (\${rawName})\\n   └ ⚡ <b>السعرات:</b> ~\${cal} kcal | 🥩 <b>البروتين:</b> ~\${prot}g | 🍞 <b>كارب:</b> ~\${carb}g | 🥑 <b>دهون:</b> ~\${fat}g\`);
        } catch (e) {
          console.warn('nutrition insert error:', e.message);
        }
      }
    }`;

handlersCode = handlersCode.replace(oldNutritionHandler, newNutritionHandler);
fs.writeFileSync('./lib/handlers.js', handlersCode, 'utf8');
console.log('✅ Updated handlers.js with smart macro fallback and time-aware meal classification');
