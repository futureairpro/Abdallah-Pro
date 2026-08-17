// 🕌 Cairo Accurate Astronomical Prayer Times Engine
// Egyptian General Authority of Survey (Fajr: 19.5°, Isha: 17.5°, Lat: 30.0444, Long: 31.2357)

const CAIRO_LAT = 30.0444;
const CAIRO_LNG = 31.2357;
const FAJR_ANGLE = 19.5;
const ISHA_ANGLE = 17.5;

function degToRad(deg) { return (deg * Math.PI) / 180.0; }
function radToDeg(rad) { return (rad * 180.0) / Math.PI; }

export function getCairoPrayerTimes(date = new Date()) {
  // Get Day of Year
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = (date - startOfYear) + ((startOfYear.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Solar declination & equation of time
  const b = (2 * Math.PI * (dayOfYear - 81)) / 365;
  const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b); // minutes
  const declination = 23.45 * Math.sin(degToRad((360 / 365) * (dayOfYear - 81))); // degrees

  // Timezone offset for Cairo in hours (Standard +2 or DST +3)
  // Let's get timezone offset dynamically for Cairo
  const cairoTimeFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', hour: 'numeric', hour12: false });
  const utcTimeFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', hour: 'numeric', hour12: false });
  const cairoHour = Number(cairoTimeFormatter.format(date));
  const utcHour = Number(utcTimeFormatter.format(date));
  let timezoneOffset = (cairoHour - utcHour + 24) % 24;
  if (timezoneOffset > 12) timezoneOffset -= 24;
  if (timezoneOffset === 0) timezoneOffset = 3; // Fallback Cairo standard/DST

  // Solar Noon in Cairo
  const solarNoon = 12 + timezoneOffset - (CAIRO_LNG / 15) - (eot / 60);

  // Hour Angle calculation helper
  function getHourAngle(angle, isAboveHorizon = false) {
    const latRad = degToRad(CAIRO_LAT);
    const decRad = degToRad(declination);
    const targetAngleRad = degToRad(angle);

    const cosH = isAboveHorizon
      ? (Math.sin(targetAngleRad) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad))
      : (-Math.sin(targetAngleRad) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));

    if (cosH > 1 || cosH < -1) return null;
    return radToDeg(Math.acos(cosH)) / 15.0; // in hours
  }

  // Asr Calculation (Shafi'i / Egyptian Standard Shadow factor = 1)
  function getAsrHourAngle() {
    const latRad = degToRad(CAIRO_LAT);
    const decRad = degToRad(declination);
    const shadowFactor = 1;
    const asrAltitude = radToDeg(Math.atan(1 / (shadowFactor + Math.tan(Math.abs(latRad - decRad)))));
    return getHourAngle(asrAltitude, true);
  }

  const fajrHA = getHourAngle(FAJR_ANGLE, false) || 1.6;
  const sunriseHA = getHourAngle(0.833, false) || 1.4;
  const asrHA = getAsrHourAngle() || 1.1;
  const maghribHA = sunriseHA;
  const ishaHA = getHourAngle(ISHA_ANGLE, false) || 1.5;

  const fajrTime = solarNoon - fajrHA;
  const sunriseTime = solarNoon - sunriseHA;
  const dhuhrTime = solarNoon + (1 / 60); // 1 min after noon
  const asrTime = solarNoon + asrHA;
  const maghribTime = solarNoon + maghribHA + (2 / 60); // 2 mins safety
  const ishaTime = solarNoon + ishaHA;

  function toTimeStr(hoursDecimal) {
    let totalMinutes = Math.round(hoursDecimal * 60);
    let h = Math.floor(totalMinutes / 60) % 24;
    let m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  function toMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  const times = {
    fajr: toTimeStr(fajrTime),
    sunrise: toTimeStr(sunriseTime),
    dhuhr: toTimeStr(dhuhrTime),
    asr: toTimeStr(asrTime),
    maghrib: toTimeStr(maghribTime),
    isha: toTimeStr(ishaTime)
  };

  return {
    times,
    minutes: {
      fajr: toMinutes(times.fajr),
      sunrise: toMinutes(times.sunrise),
      dhuhr: toMinutes(times.dhuhr),
      asr: toMinutes(times.asr),
      maghrib: toMinutes(times.maghrib),
      isha: toMinutes(times.isha)
    }
  };
}

// Calculate Relative Target Time (e.g. "بعد العصر بنصف ساعة" -> Asr + 30 mins)
export function getRelativePrayerTarget(prayerName, offsetMinutes = 30) {
  const prayerData = getCairoPrayerTimes();
  const nameClean = prayerName.replace('صلاة', '').replace('أذان', '').replace('الـ', '').trim();

  let targetMinutes = 0;
  if (nameClean.includes('فجر')) targetMinutes = prayerData.minutes.fajr;
  else if (nameClean.includes('ظهر') || nameClean.includes('ضهر')) targetMinutes = prayerData.minutes.dhuhr;
  else if (nameClean.includes('عصر')) targetMinutes = prayerData.minutes.asr;
  else if (nameClean.includes('مغرب')) targetMinutes = prayerData.minutes.maghrib;
  else if (nameClean.includes('عشاء') || nameClean.includes('عشا')) targetMinutes = prayerData.minutes.isha;
  else targetMinutes = prayerData.minutes.asr; // default

  targetMinutes += offsetMinutes;
  const h = Math.floor(targetMinutes / 60) % 24;
  const m = targetMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
