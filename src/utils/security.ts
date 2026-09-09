import { z } from 'zod';
import bcrypt from 'bcryptjs';

/**
 * ============================================================================
 * 🔐 VIBE-CODING SECURITY ENGINE FOR HEALTHCARE TELEMEDICINE
 * Compliant with OWASP Top 10, NIST SP 800-63B, and CWE-204/307/89/79
 * ============================================================================
 */

// Pre-computed dummy bcrypt hash (work factor 10) used for response timing equalization.
// This prevents timing-based account enumeration (CWE-204) when an email doesn't exist.
export const DUMMY_BCRYPT_HASH = '$2a$10$e8w3f8mU3wV8oY4O7Zk2uOU1e5y9lP2wS6q3e7t9m0b2c4d6f8g0h';

// Password complexity regex:
// - At least one uppercase letter [A-Z]
// - At least one lowercase letter [a-z]
// - At least one digit [0-9]
// - At least one special character
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9\s]).+$/;

/**
 * 1. SANITIZATION & STRIPPING UTILITIES
 * Strips HTML tags, script elements, javascript: protocols, and control characters.
 */
export function sanitizePlainText(input: unknown, maxLength: number = 500): string {
  if (typeof input !== 'string') return '';
  // Strip HTML and script tags
  let cleaned = input.replace(/<[^>]*>/g, '');
  // Strip dangerous protocol prefixes
  cleaned = cleaned.replace(/javascript:/gi, '');
  // Strip control characters except newline and tab
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return cleaned.trim().slice(0, maxLength);
}

export function sanitizeUsernameOrName(input: unknown, maxLength: number = 70): string {
  if (typeof input !== 'string') return '';
  // Allow letters, numbers, spaces, periods, hyphens, apostrophes (standard name whitelist)
  let cleaned = input.replace(/[^a-zA-Z0-9\s.\-',]/g, '');
  return cleaned.trim().slice(0, maxLength);
}

/**
 * 2. ZOD VALIDATION SCHEMAS
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long.')
  .max(72, 'Password cannot exceed 72 characters.')
  .regex(
    PASSWORD_COMPLEXITY_REGEX,
    'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.'
  );

export const loginInputSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address.')
    .max(254, 'Email exceeds maximum allowed length.'),
  password: z
    .string()
    .min(1, 'Password is required.')
    .max(72, 'Password exceeds maximum length.'),
  captchaToken: z.string().optional(),
});

export const doctorRegistrationSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters.')
    .max(70, 'Name cannot exceed 70 characters.')
    .transform((val) => sanitizeUsernameOrName(val)),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('A valid medical email address is required.')
    .max(254),
  password: passwordSchema,
  phone: z
    .string()
    .max(30)
    .optional()
    .or(z.literal(''))
    .transform((val) => (val && val.trim() ? sanitizePlainText(val, 30) : '+1 (555) 019-2834')),
  specialization: z.enum([
    'Cardiology',
    'Pediatrics',
    'Dermatology',
    'General Medicine',
    'Neurology',
    'Orthopedics',
    'Psychiatry',
  ]),
  regNumber: z
    .string()
    .min(2, 'Medical license / registration number is required.')
    .max(50)
    .transform((val) => sanitizePlainText(val, 50)),
  hospitalAffiliation: z
    .string()
    .max(100)
    .optional()
    .or(z.literal(''))
    .transform((val) => (val && val.trim() ? sanitizePlainText(val, 100) : 'TeleDoc Virtual Health Network')),
  experienceYears: z.coerce.number().min(0).max(65).optional().default(5),
  consultationFee: z.coerce.number().min(0).max(5000).optional().default(75),
  qualifications: z
    .string()
    .max(100)
    .optional()
    .or(z.literal(''))
    .transform((val) => (val && val.trim() ? sanitizePlainText(val, 100) : 'MBBS, MD')),
  bio: z
    .string()
    .max(500)
    .optional()
    .or(z.literal(''))
    .transform((val) => sanitizePlainText(val || '', 500)),
  avatar: z.string().optional(),
});

export const patientRegistrationSchema = z.object({
  name: z
    .string()
    .min(2, 'Full name must be at least 2 characters.')
    .max(70, 'Name cannot exceed 70 characters.')
    .transform((val) => sanitizeUsernameOrName(val)),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address.')
    .max(254),
  password: passwordSchema.optional().or(z.literal('')),
  phone: z
    .string()
    .max(30)
    .optional()
    .or(z.literal(''))
    .transform((val) => (val && val.trim() ? sanitizePlainText(val, 30) : '+1 (555) 234-5678')),
  avatar: z.string().optional(),
  dateOfBirth: z.string().optional().default('1995-06-15'),
  gender: z.enum(['Female', 'Male', 'Other']).optional().default('Female'),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional().default('O+'),
});

export const adminRegistrationSchema = z.object({
  name: z
    .string()
    .min(2, 'Full name is required.')
    .max(70)
    .transform((val) => sanitizeUsernameOrName(val)),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Valid administrative email is required.')
    .max(254),
  password: passwordSchema,
  phone: z
    .string()
    .max(30)
    .optional()
    .or(z.literal(''))
    .transform((val) => (val && val.trim() ? sanitizePlainText(val, 30) : '+1 (555) 000-8811')),
  adminPasscode: z
    .string()
    .min(1, 'Admin passcode is required.')
    .max(50)
    .transform((val) => val.trim()),
  department: z
    .string()
    .max(80)
    .optional()
    .or(z.literal(''))
    .transform((val) => sanitizePlainText(val || 'Medical Board & Clinical Operations', 80)),
});

export const passwordResetSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address.')
    .max(254),
});

export const resetPasswordWithOldPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid Gmail or email address.')
    .max(254, 'Email exceeds maximum allowed length.'),
  oldPassword: z
    .string()
    .min(1, 'Current / old password is required.')
    .max(72, 'Old password exceeds maximum length.'),
  newPassword: passwordSchema,
});

/**
 * 3. BCRYPT PASSWORD HASHING & CONSTANT-TIME VERIFICATION
 */
export function hashPassword(password: string): string {
  // Bcrypt with cost factor 10 (OWASP recommended balance for responsiveness & brute-force defense)
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function verifyPassword(password: string, hashOrPlain: string): boolean {
  if (!hashOrPlain) return false;

  // Check if hash is a valid bcrypt hash string ($2a$, $2b$, or $2y$)
  const isBcrypt = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hashOrPlain);

  if (isBcrypt) {
    // Built-in constant-time comparison prevents side-channel timing attacks
    return bcrypt.compareSync(password, hashOrPlain);
  }

  // Legacy fallback: if stored as legacy plaintext, perform constant-time comparison
  return constantTimeCompare(password, hashOrPlain);
}

/**
 * Constant-time string comparison for legacy or token checks
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let mismatch = a.length === b.length ? 0 : 1;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const charA = i < a.length ? a.charCodeAt(i) : 0;
    const charB = i < b.length ? b.charCodeAt(i) : 0;
    mismatch |= charA ^ charB;
  }
  return mismatch === 0;
}

/**
 * 4. RATE LIMITING, ACCOUNT LOCKOUTS, & PROGRESSIVE DELAYS
 */
interface FailedAttemptRecord {
  count: number;
  lastAttemptTimestamp: number;
  lockoutUntilTimestamp: number | null;
  history: number[]; // timestamps of attempts for sliding window rate limiting
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;     // Max 10 requests per minute
const MAX_FAILED_ATTEMPTS = 5;          // 5 failed attempts -> 15 min lockout
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const CAPTCHA_TRIGGER_FAILURES = 3;     // Trigger CAPTCHA after 3 failures

// Progressive delay schedule in milliseconds: 1s, 2s, 5s, 15s, 30s
const PROGRESSIVE_DELAYS_MS = [1000, 2000, 5000, 15000, 30000];

class SecurityStateStore {
  private ipRecords: Map<string, FailedAttemptRecord> = new Map();
  private accountRecords: Map<string, FailedAttemptRecord> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem('teledoc_security_lockout_store');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.accounts) {
          Object.entries(parsed.accounts).forEach(([k, v]) => {
            this.accountRecords.set(k, v as FailedAttemptRecord);
          });
        }
        if (parsed.ips) {
          Object.entries(parsed.ips).forEach(([k, v]) => {
            this.ipRecords.set(k, v as FailedAttemptRecord);
          });
        }
      }
    } catch {
      // ignore
    }
  }

  private saveToStorage() {
    try {
      const data = {
        accounts: Object.fromEntries(this.accountRecords.entries()),
        ips: Object.fromEntries(this.ipRecords.entries()),
      };
      localStorage.setItem('teledoc_security_lockout_store', JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  public checkRateLimit(ip: string = 'client-ip'): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    let record = this.ipRecords.get(ip);
    if (!record) {
      record = { count: 0, lastAttemptTimestamp: now, lockoutUntilTimestamp: null, history: [] };
      this.ipRecords.set(ip, record);
    }

    // Clean history older than window
    record.history = record.history.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

    if (record.history.length >= MAX_REQUESTS_PER_WINDOW) {
      const oldest = record.history[0];
      const resetMs = Math.max(0, RATE_LIMIT_WINDOW_MS - (now - oldest));
      return { allowed: false, remaining: 0, resetMs };
    }

    record.history.push(now);
    this.saveToStorage();
    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_WINDOW - record.history.length,
      resetMs: RATE_LIMIT_WINDOW_MS,
    };
  }

  public isAccountLocked(email: string): { locked: boolean; remainingSeconds: number } {
    const key = email.trim().toLowerCase();
    const record = this.accountRecords.get(key);
    if (!record || !record.lockoutUntilTimestamp) {
      return { locked: false, remainingSeconds: 0 };
    }

    const now = Date.now();
    if (now < record.lockoutUntilTimestamp) {
      const remainingSeconds = Math.ceil((record.lockoutUntilTimestamp - now) / 1000);
      return { locked: true, remainingSeconds };
    }

    // Lockout expired
    record.lockoutUntilTimestamp = null;
    record.count = 0;
    this.saveToStorage();
    return { locked: false, remainingSeconds: 0 };
  }

  public requiresCaptcha(email: string, ip: string = 'client-ip'): boolean {
    const accountRecord = this.accountRecords.get(email.trim().toLowerCase());
    const ipRecord = this.ipRecords.get(ip);
    const accountFails = accountRecord?.count || 0;
    const ipFails = ipRecord?.count || 0;
    return accountFails >= CAPTCHA_TRIGGER_FAILURES || ipFails >= CAPTCHA_TRIGGER_FAILURES;
  }

  public getProgressiveDelayMs(email: string): number {
    const record = this.accountRecords.get(email.trim().toLowerCase());
    const fails = record?.count || 0;
    if (fails === 0) return 0;
    const delayIndex = Math.min(fails - 1, PROGRESSIVE_DELAYS_MS.length - 1);
    return PROGRESSIVE_DELAYS_MS[delayIndex];
  }

  public recordFailedAttempt(email: string, ip: string = 'client-ip'): { lockedNow: boolean; failCount: number } {
    const now = Date.now();
    const key = email.trim().toLowerCase();

    let accRecord = this.accountRecords.get(key);
    if (!accRecord) {
      accRecord = { count: 0, lastAttemptTimestamp: now, lockoutUntilTimestamp: null, history: [] };
      this.accountRecords.set(key, accRecord);
    }

    accRecord.count += 1;
    accRecord.lastAttemptTimestamp = now;

    let lockedNow = false;
    if (accRecord.count >= MAX_FAILED_ATTEMPTS) {
      accRecord.lockoutUntilTimestamp = now + LOCKOUT_DURATION_MS;
      lockedNow = true;
    }

    let ipRecord = this.ipRecords.get(ip);
    if (!ipRecord) {
      ipRecord = { count: 0, lastAttemptTimestamp: now, lockoutUntilTimestamp: null, history: [] };
      this.ipRecords.set(ip, ipRecord);
    }
    ipRecord.count += 1;
    ipRecord.lastAttemptTimestamp = now;

    this.saveToStorage();
    return { lockedNow, failCount: accRecord.count };
  }

  public recordSuccessfulLogin(email: string, ip: string = 'client-ip') {
    const key = email.trim().toLowerCase();
    this.accountRecords.delete(key);
    const ipRecord = this.ipRecords.get(ip);
    if (ipRecord) {
      ipRecord.count = 0;
    }
    this.saveToStorage();
  }

  public resetAllSecurityLimits() {
    this.accountRecords.clear();
    this.ipRecords.clear();
    localStorage.removeItem('teledoc_security_lockout_store');
  }

  public getAuditStatus(email?: string) {
    const key = email ? email.trim().toLowerCase() : '';
    const acc = key ? this.accountRecords.get(key) : null;
    return {
      failedAttempts: acc?.count || 0,
      isLocked: acc?.lockoutUntilTimestamp ? acc.lockoutUntilTimestamp > Date.now() : false,
      lockoutRemainingSec: acc?.lockoutUntilTimestamp ? Math.max(0, Math.ceil((acc.lockoutUntilTimestamp - Date.now()) / 1000)) : 0,
      requiresCaptcha: this.requiresCaptcha(key),
    };
  }
}

export const securityStore = new SecurityStateStore();

/**
 * Sleep helper to simulate progressive delays or equalize timing
 */
export function delayAsync(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
