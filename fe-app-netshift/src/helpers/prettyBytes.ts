export function prettyBytes(n?: number | null) {
  const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  if (n === undefined || n === null || isNaN(Number(n)) || Number(n) <= 0) {
    return '0 B';
  }

  const num = Number(n);
  if (num < 1000) {
    return num + ' B';
  }
  const exponent = Math.min(Math.floor(Math.log10(num) / 3), UNITS.length - 1);
  const formatted = Number((num / Math.pow(1000, exponent)).toPrecision(3));
  const unit = UNITS[exponent];
  return formatted + ' ' + unit;
}
