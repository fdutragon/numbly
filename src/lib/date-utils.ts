/**
 * Utilitários para manipulação de datas no formato brasileiro
 */

// Converte data do input HTML (YYYY-MM-DD) para formato brasileiro (DD/MM/YYYY)
export function convertInputDateToBrazilian(inputDate: string): string {
  if (!inputDate) return '';
  
  const [year, month, day] = inputDate.split('-');
  return `${day}/${month}/${year}`;
}

// Converte data brasileira (DD/MM/YYYY) para formato do input HTML (YYYY-MM-DD)
export function convertBrazilianToInputDate(brazilianDate: string): string {
  if (!brazilianDate) return '';
  
  const [day, month, year] = brazilianDate.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Valida se a data está no formato brasileiro válido
export function validateBrazilianDate(date: string): boolean {
  if (!date) return false;
  
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!regex.test(date)) return false;
  
  const [day, month, year] = date.split('/').map(Number);
  
  // Validações básicas
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > new Date().getFullYear()) return false;
  
  // Validação de dias por mês
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  // Verifica ano bissexto
  if (month === 2 && isLeapYear(year)) {
    daysInMonth[1] = 29;
  }
  
  if (day > daysInMonth[month - 1]) return false;
  
  // Verifica se não é data futura
  const dateObj = new Date(year, month - 1, day);
  return dateObj <= new Date();
}

// Verifica se o ano é bissexto
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// Formata data para exibição brasileira
export function formatDateBrazilian(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  return `${day}/${month}/${year}`;
}

// Converte string de data para objeto Date considerando formato brasileiro
export function parseBrazilianDate(dateString: string): Date {
  const [day, month, year] = dateString.split('/').map(Number);
  return new Date(year, month - 1, day);
}
