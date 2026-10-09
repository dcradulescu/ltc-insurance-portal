/**
 * Form validation and formatting utilities
 */

// Capitalize first letter of each word
export const capitalizeWords = (value: string): string => {
  if (!value) return '';
  return value
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Format phone number to (###)###-####
export const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  const cleaned = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)})${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)})${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
};

// Validate phone number format
export const isValidPhoneNumber = (value: string): boolean => {
  const pattern = /^\(\d{3}\)\d{3}-\d{4}$/;
  return pattern.test(value);
};

// Format date to MM/DD/YYYY
export const formatDateInput = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
};

// Validate date format MM/DD/YYYY
export const isValidDateFormat = (value: string): boolean => {
  const pattern = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!pattern.test(value)) return false;
  
  const [month, day, year] = value.split('/').map(Number);
  
  // Basic validation
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  
  // Check for valid day in month
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)) {
    return day <= 29;
  }
  return day <= daysInMonth[month - 1];
};

// Validate email address
export const isValidEmail = (value: string): boolean => {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(value);
};

// Format currency to $###,###.##
export const formatCurrency = (value: string): string => {
  if (!value.trim()) return '';
  if (value.includes('-')) return value;
  let cleaned = value.replace(/[^0-9.]/g, '');
  
  // Handle multiple decimal points
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts[1];
  }
  
  const [dollarPart, centPart] = cleaned.split('.');
  let dollars = dollarPart || '0';
  let cents = centPart ? centPart.substring(0, 2) : '00';
  
  // Allow up to 10 digits for dollars
  if (dollars.length > 10) {
    dollars = dollars.substring(0, 10);
  }
  
  // Remove leading zeros but keep at least one digit
  dollars = dollars.replace(/^0+/, '') || '0';
  
  // Add thousands separators
  dollars = dollars.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Pad cents to 2 digits
  cents = (cents + '00').substring(0, 2);
  
  return `$${dollars}.${cents}`;
};

// Validate currency format
export const isValidCurrency = (value: string): boolean => {
  const pattern = /^\$\d+\.\d{2}$/;
  return pattern.test(value);
};

// Format number only (no special characters)
export const formatNumberOnly = (value: string): string => {
  return value.replace(/\D/g, '');
};

// Validate number only
export const isValidNumberOnly = (value: string): boolean => {
  return /^\d+$/.test(value);
};

// Format days with "Days" suffix
export const formatDaysWithSuffix = (value: string): string => {
  const cleaned = formatNumberOnly(value);
  if (!cleaned) return '';
  return `${cleaned} Days`;
};

// Extract number from "### Days" format
export const extractDaysNumber = (value: string): string => {
  return value.replace(/\D/g, '');
};

// Validate address (basic - just check it's not empty)
export const isValidAddress = (value: string): boolean => {
  return value.trim().length > 0;
};

// Format address line (capitalize first letter of each word)
export const formatAddressLine = (value: string): string => {
  return capitalizeWords(value);
};
