
export const getFrenchPublicHolidays = (year: number) => {
  const holidays = [
    `${year}-01-01`, // Nouvel An
    `${year}-05-01`, // Fête du Travail
    `${year}-05-08`, // Victoire 1945
    `${year}-07-14`, // Fête Nationale
    `${year}-08-15`, // Assomption
    `${year}-11-01`, // Toussaint
    `${year}-11-11`, // Armistice
    `${year}-12-25`, // Noël
  ];

  const a = year % 19, b = Math.floor(year / 100), c = year % 100,
        d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
        g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
        i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7,
        m = Math.floor((a + 11 * h + 22 * l) / 451);
  const n = h + l - 7 * m + 114;
  const month = Math.floor(n / 31);
  const day = (n % 31) + 1;

  const easter = new Date(year, month - 1, day);
  const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  holidays.push(addDays(easter, 1)); // Lundi de Pâques
  holidays.push(addDays(easter, 39)); // Ascension
  holidays.push(addDays(easter, 50)); // Lundi de Pentecôte

  return holidays;
};

export const isSundayOrHoliday = (dateStr: string) => {
  const date = new Date(dateStr);
  if (date.getDay() === 0) return true; // Dimanche
  const year = date.getFullYear();
  const holidays = getFrenchPublicHolidays(year);
  return holidays.includes(dateStr);
};

export const getLocalDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
