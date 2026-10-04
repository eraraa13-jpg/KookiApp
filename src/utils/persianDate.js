import { toPersianDigits } from './formatters';

const MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

export function gregorianToJalali(gy, gm, gd) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100)
    + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { year: jy, month: jm, day: jd };
}

export function getTodayJalali() {
  const n = new Date();
  return gregorianToJalali(n.getFullYear(), n.getMonth() + 1, n.getDate());
}

export function getCurrentJalaliMonth() {
  const t = getTodayJalali();
  return { year: t.year, month: t.month };
}

export function getJalaliMonthName(m) {
  return MONTHS[m - 1] || '';
}

export function formatJalaliDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const j = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return toPersianDigits(j.day + ' ' + MONTHS[j.month - 1] + ' ' + j.year);
}

export function getStartOfJalaliMonth(jy, jm) {
  const approx = new Date(jy + 621, jm - 1, 1);
  approx.setDate(approx.getDate() - 15);
  return approx;
}

export function getEndOfJalaliMonth(jy, jm) {
  const approx = new Date(jy + 621, jm, 1);
  approx.setDate(approx.getDate() + 25);
  return approx;
}

export { MONTHS as PERSIAN_MONTHS };