const pad = (value: number) => `${value}`.padStart(2, "0");

export const extractDateKey = (value?: string) => {
  if (!value) return "";

  const keyMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (keyMatch) return keyMatch[1];

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return `${parsed.getUTCFullYear()}-${pad(parsed.getUTCMonth() + 1)}-${pad(parsed.getUTCDate())}`;
};

export const dateKeyFromLocalDate = (date: Date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const dateKeyToLocalDate = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const formatDatePtBr = (value?: string) => {
  const key = extractDateKey(value);
  if (!key) return "";

  const [year, month, day] = key.split("-");
  return `${day}/${month}/${year}`;
};

export const dateKeyToIsoNoonUTC = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).toISOString();
};
