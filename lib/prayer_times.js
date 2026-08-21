// 🕌 Cairo Live & Accurate Prayer Times Engine
// Official Egyptian General Authority of Survey (الهيئة المصرية العامة للمساحة)
// Lat: 30.0444, Long: 31.2357, Fajr: 19.5°, Isha: 17.5°

const CAIRO_LAT = 30.0444;
const CAIRO_LNG = 31.2357;
const FAJR_ANGLE = 19.5;
const ISHA_ANGLE = 17.5;

function degToRad(deg) { return (deg * Math.PI) / 180.0; }
function radToDeg(rad) { return (rad * 180.0) / Math.PI; }

const PRAYER_CACHE = new Map();

function format12Hour(timeStr) {
  if (!timeStr) return '';
  const [hourStr, minStr] = timeStr.split(':');
  let h = parseInt(hourStr, 10);
  const m = minStr.padStart(2, '0');
  const suffix = h >= 12 ? 'م' : 'ص';
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${m} ${suffix}`;
}

function toMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export async function fetchOfficialCairoPrayerTimes(date = new Date()) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  const dateStr = `${d}-${m}-${y}`;
  const dateKey = `${y}-${m}-${d}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=Cairo&country=Egypt&method=5`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const t = data.data?.timings;
      if (t && t.Fajr && t.Dhuhr && t.Asr && t.Maghrib && t.Isha) {
        const cleanTime = (val) => val.split(' ')[0].trim();
        const times = {
          fajr: cleanTime(t.Fajr),
          sunrise: cleanTime(t.Sunrise),
          dhuhr: cleanTime(t.Dhuhr),
          asr: cleanTime(t.Asr),
          maghrib: cleanTime(t.Maghrib),
          isha: cleanTime(t.Isha)
        };

        const prayerObj = {
          source: 'official_egyptian_survey_authority',
          times,
          times12: {
            fajr: format12Hour(times.fajr),
            sunrise: format12Hour(times.sunrise),
            dhuhr: format12Hour(times.dhuhr),
            asr: format12Hour(times.asr),
            maghrib: format12Hour(times.maghrib),
            isha: format12Hour(times.isha)
          },
          minutes: {
            fajr: toMinutes(times.fajr),
            sunrise: toMinutes(times.sunrise),
            dhuhr: toMinutes(times.dhuhr),
            asr: toMinutes(times.asr),
            maghrib: toMinutes(times.maghrib),
            isha: toMinutes(times.isha)
          }
        };

        PRAYER_CACHE.set(dateKey, prayerObj);
        return prayerObj;
      }
    }
  } catch (e) {
    // Fail silently and use astronomical calculation
  }
  return null;
}

// Immediate warm-up on startup
try {
  fetchOfficialCairoPrayerTimes(new Date()).catch(() => {});
  fetchOfficialCairoPrayerTimes(new Date(Date.now() + 86400000)).catch(() => {});
} catch (_) {}

function calculateAstronomicalCairoPrayerTimes(date = new Date()) {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = (date - startOfYear) + ((startOfYear.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const b = (2 * Math.PI * (dayOfYear - 81)) / 365;
  const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b); // minutes
  const declination = 23.45 * Math.sin(degToRad((360 / 365) * (dayOfYear - 81))); // degrees

  const cairoTimeFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', hour: 'numeric', hour12: false });
  const utcTimeFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', hour: 'numeric', hour12: false });
  const cairoHour = Number(cairoTimeFormatter.format(date));
  const utcHour = Number(utcTimeFormatter.format(date));
  let timezoneOffset = (cairoHour - utcHour + 24) % 24;
  if (timezoneOffset > 12) timezoneOffset -= 24;
  if (timezoneOffset === 0) timezoneOffset = 3;

  const solarNoon = 12 + timezoneOffset - (CAIRO_LNG / 15) - (eot / 60);

  function getHourAngle(angle, isAboveHorizon = false) {
    const latRad = degToRad(CAIRO_LAT);
    const decRad = degToRad(declination);
    const targetAngleRad = degToRad(angle);

    const cosH = isAboveHorizon
      ? (Math.sin(targetAngleRad) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad))
      : (-Math.sin(targetAngleRad) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));

    if (cosH > 1 || cosH < -1) return null;
    return radToDeg(Math.acos(cosH)) / 15.0;
  }

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
  const dhuhrTime = solarNoon + (1 / 60);
  const asrTime = solarNoon + asrHA;
  const maghribTime = solarNoon + maghribHA; // Exact Sunset without arbitrary safety distortion
  const ishaTime = solarNoon + ishaHA;

  function toTimeStr(hoursDecimal) {
    let totalMinutes = Math.round(hoursDecimal * 60);
    let h = Math.floor(totalMinutes / 60) % 24;
    let m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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
    source: 'astronomical_noaa_fallback',
    times,
    times12: {
      fajr: format12Hour(times.fajr),
      sunrise: format12Hour(times.sunrise),
      dhuhr: format12Hour(times.dhuhr),
      asr: format12Hour(times.asr),
      maghrib: format12Hour(times.maghrib),
      isha: format12Hour(times.isha)
    },
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

export function getCairoPrayerTimes(date = new Date()) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  const dateKey = `${y}-${m}-${d}`;

  if (PRAYER_CACHE.has(dateKey)) {
    return PRAYER_CACHE.get(dateKey);
  }

  // Trigger background live fetch to populate cache for subsequent calls
  fetchOfficialCairoPrayerTimes(date).catch(() => {});

  return calculateAstronomicalCairoPrayerTimes(date);
}

export function formatTime12(timeStr) {
  return format12Hour(timeStr);
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
  else targetMinutes = prayerData.minutes.asr;

  targetMinutes += offsetMinutes;
  const h = Math.floor(targetMinutes / 60) % 24;
  const m = targetMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
