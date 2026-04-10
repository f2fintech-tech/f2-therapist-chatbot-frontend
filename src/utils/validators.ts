/**
 * Validate an email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate a password (minimum 8 characters)
 */
export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * Validate a strong password (8+ chars, uppercase, lowercase, number)
 */
export function validateStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

/**
 * Validate that a name has at least 2 characters
 */
export function validateName(name: string): boolean {
  return name.trim().length >= 2;
}

/**
 * Validate a phone number (basic international format)
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{6,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
}

/**
 * Validate a URL
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a string is empty or only whitespace
 */
export function isEmpty(value: string): boolean {
  return value.trim().length === 0;
}

/**
 * Get password strength score (0-4)
 */
export function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}
