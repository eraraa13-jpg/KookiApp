export function toPersianDigits(str) {
  if (str == null) return '';
  return str.toString().replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
}

export function toEnglishDigits(str) {
  if (!str) return '';
  return str.toString()
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
}

export function formatNumber(num) {
  if (num == null) return '۰';
  const s = Math.abs(Math.round(num)).toString();
  let r = '';
  for (let i = s.length - 1, c = 0; i >= 0; i--, c++) {
    if (c > 0 && c % 3 === 0) r = ',' + r;
    r = s[i] + r;
  }
  return toPersianDigits(r);
}

export function formatCurrency(amount) {
  return formatNumber(amount) + ' تومان';
}