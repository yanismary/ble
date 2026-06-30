export const EMPTY_BLE_DATE = '--/--/----';

function toNumber(value: any): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const numericValue = Number(value);
  if (isNaN(numericValue) || !isFinite(numericValue)) {
    return null;
  }

  return numericValue;
}

function formatTwoDigits(value: number): string {
  return ('0' + value).slice(-2);
}

function isValidByte(value: number | null): value is number {
  return value !== null && value >= 0 && value <= 0xFF && Math.floor(value) === value;
}

export function formatHexByte(value: any): string {
  const numericValue = toNumber(value);
  if (!isValidByte(numericValue)) {
    return '';
  }

  return ('0' + numericValue.toString(16).toUpperCase()).slice(-2);
}

export function formatBleDate(yearByte: any, monthByte: any, dayByte: any): string {
  const yearValue = toNumber(yearByte);
  const monthValue = toNumber(monthByte);
  const dayValue = toNumber(dayByte);

  if (!isValidByte(yearValue) || !isValidByte(monthValue) || !isValidByte(dayValue)) {
    return EMPTY_BLE_DATE;
  }

  if (yearValue === 0xFF || monthValue === 0xFF || dayValue === 0xFF) {
    return EMPTY_BLE_DATE;
  }

  const year = 2000 + yearValue;
  const month = monthValue + 1;
  const day = dayValue;

  if (day <= 0 || day > 31 || month <= 0 || month > 12 || year < 2000 || year > 2099) {
    return EMPTY_BLE_DATE;
  }

  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return EMPTY_BLE_DATE;
  }

  return formatTwoDigits(day) + '/' + formatTwoDigits(month) + '/' + year;
}

export function getSignalQualityFromRssi(rssi: any): number {
  const numericRssi = toNumber(rssi);
  if (numericRssi === null) {
    return -1;
  }

  if (numericRssi >= -60) {
    return 4;
  }
  if (numericRssi >= -70) {
    return 3;
  }
  if (numericRssi >= -80) {
    return 2;
  }
  if (numericRssi >= -90) {
    return 1;
  }

  return 0;
}
