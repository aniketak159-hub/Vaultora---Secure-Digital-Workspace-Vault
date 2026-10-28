/**
 * Client-Side Zero-Knowledge Cryptography Service for Vaultora
 * 
 * Enforces zero-knowledge: plaintexts and master passphrases never leave the client context.
 * Utilizes standard Web Crypto API (SubtleCrypto) for AES-256-GCM and PBKDF2/SHA-256 key derivation.
 */

// BIP-39 inspired wordlist for emergency recovery phrases
export const RECOVERY_WORDS = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
  'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
  'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit',
  'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
  'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert',
  'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter',
  'always', 'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger',
  'angle', 'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique',
  'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arch', 'arctic',
  'area', 'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange', 'arrest',
  'arrive', 'arrow', 'art', 'artefact', 'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset',
  'assist', 'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction',
  'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado', 'avoid', 'awake',
  'aware', 'away', 'awesome', 'awful', 'awkward', 'axis', 'baby', 'bachelor', 'bacon', 'badge',
  'bag', 'balance', 'balcony', 'ball', 'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain',
  'barrel', 'base', 'basic', 'basket', 'battle', 'beach', 'bean', 'beauty', 'because', 'become'
];

export interface PasswordStrength {
  score: number; // 0 to 4 (0: Very Weak, 1: Weak, 2: Fair, 3: Strong, 4: Unbreakable)
  label: 'Critical / Very Weak' | 'Weak' | 'Moderate' | 'Strong' | 'Exceptional';
  entropyBits: number;
  crackTimeEstimate: string;
  feedback: string[];
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      label: 'Critical / Very Weak',
      entropyBits: 0,
      crackTimeEstimate: 'Instant',
      feedback: ['Password is empty']
    };
  }

  const length = password.length;
  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

  const entropyBits = Math.round(length * Math.log2(Math.max(poolSize, 2)));
  const feedback: string[] = [];

  if (length < 10) feedback.push('Length is under 10 characters');
  if (!/[A-Z]/.test(password)) feedback.push('Add uppercase letters');
  if (!/[0-9]/.test(password)) feedback.push('Add numeric digits');
  if (!/[^a-zA-Z0-9]/.test(password)) feedback.push('Add special symbols');

  let score = 0;
  let label: PasswordStrength['label'] = 'Critical / Very Weak';
  let crackTimeEstimate = 'Instant';

  if (entropyBits < 32) {
    score = 0;
    label = 'Critical / Very Weak';
    crackTimeEstimate = 'Milliseconds';
  } else if (entropyBits < 48) {
    score = 1;
    label = 'Weak';
    crackTimeEstimate = 'Few minutes';
  } else if (entropyBits < 64) {
    score = 2;
    label = 'Moderate';
    crackTimeEstimate = 'Several months';
  } else if (entropyBits < 80) {
    score = 3;
    label = 'Strong';
    crackTimeEstimate = 'Centuries';
  } else {
    score = 4;
    label = 'Exceptional';
    crackTimeEstimate = 'Millions of years';
  }

  return {
    score,
    label,
    entropyBits,
    crackTimeEstimate,
    feedback
  };
}

export interface PasswordGeneratorOptions {
  length: number;
  useUpper: boolean;
  useLower: boolean;
  useNumbers: boolean;
  useSymbols: boolean;
  avoidAmbiguous: boolean; // 1, l, I, 0, O
  mode: 'password' | 'passphrase';
  wordCount?: number;
  wordSeparator?: string;
  capitalizeWords?: boolean;
}

export function generateSecureSecret(options: PasswordGeneratorOptions): string {
  if (options.mode === 'passphrase') {
    const count = options.wordCount || 4;
    const sep = options.wordSeparator ?? '-';
    const chosen: string[] = [];
    const array = new Uint32Array(count);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < count; i++) {
      let word = RECOVERY_WORDS[array[i] % RECOVERY_WORDS.length];
      if (options.capitalizeWords) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }
      chosen.push(word);
    }
    return chosen.join(sep);
  }

  let chars = '';
  if (options.useLower) chars += options.avoidAmbiguous ? 'abcdefghijkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
  if (options.useUpper) chars += options.avoidAmbiguous ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (options.useNumbers) chars += options.avoidAmbiguous ? '23456789' : '0123456789';
  if (options.useSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (!chars) chars = 'abcdefghijkmnpqrstuvwxyz23456789';

  const randomValues = new Uint32Array(options.length);
  window.crypto.getRandomValues(randomValues);

  let result = '';
  for (let i = 0; i < options.length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

export function generateEmergencyRecoveryPhrase(): string[] {
  const words: string[] = [];
  const random = new Uint32Array(24);
  window.crypto.getRandomValues(random);
  for (let i = 0; i < 24; i++) {
    words.push(RECOVERY_WORDS[random[i] % RECOVERY_WORDS.length]);
  }
  return words;
}

/**
 * Privacy-preserving k-anonymity SHA-1 hash generator
 */
export async function calculateSha1Hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * Known simulated breach sample database (k-anonymity prefix lookup demo)
 */
const KNOWN_BREACH_PREFIXES = new Set([
  '5BAA6', // password
  '7C4A8', // 123456
  'E807F', // admin123
  '4E074', // qwerty
  'F359E', // letmein
  '3C990', // password123
]);

export async function checkCredentialBreachStatus(password: string): Promise<{ isCompromised: boolean; hashPrefix: string; breachCount?: number }> {
  if (!password) return { isCompromised: false, hashPrefix: '' };
  try {
    const fullHash = await calculateSha1Hex(password);
    const prefix = fullHash.substring(0, 5);
    const isCompromised = KNOWN_BREACH_PREFIXES.has(prefix) || password.toLowerCase() === 'password' || password === '123456' || password === 'admin123';
    return {
      isCompromised,
      hashPrefix: prefix,
      breachCount: isCompromised ? 3847291 : 0
    };
  } catch {
    return { isCompromised: false, hashPrefix: '' };
  }
}

/* =========================================================================================
   Zero-Knowledge AES-256-GCM & PBKDF2 WebCrypto Engine (Production Storage & Backup Support)
   ========================================================================================= */

// OWASP Recommended iteration count for PBKDF2-HMAC-SHA256 (600,000 iterations)
export const PBKDF2_ITERATIONS = 600000;
// 256-bit cryptographically secure salt length
export const SALT_BYTE_LENGTH = 32;
// 96-bit standard nonce length for AES-GCM
export const IV_BYTE_LENGTH = 12;

/**
 * Generates a cryptographically strong random salt of specified byte length.
 */
export function generateSalt(byteLength: number = SALT_BYTE_LENGTH): Uint8Array {
  const salt = new Uint8Array(byteLength);
  window.crypto.getRandomValues(salt);
  return salt;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives a strong 256-bit AES-GCM CryptoKey from a user passphrase and salt via PBKDF2.
 * The resulting CryptoKey is explicitly non-extractable (extractable: false) to prevent
 * memory dump attacks via subtle.exportKey.
 */
export async function deriveKeyFromPassphrase(
  passphrase: string, 
  salt: Uint8Array, 
  iterations: number = PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false, // Non-extractable raw password representation
    ['deriveKey', 'deriveBits']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false, // Non-extractable derived AES key
    ['encrypt', 'decrypt']
  );
}

/**
 * Derives both the non-extractable CryptoKey and the ephemeral raw 256-bit key bytes
 * to allow sealing into a Zero-Knowledge Recovery Envelope without weakening RAM security.
 */
export async function deriveKeyAndRawBitsFromPassphrase(
  passphrase: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS
): Promise<{ key: CryptoKey; rawBits: Uint8Array }> {
  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey', 'deriveBits']
  );

  const rawBitsBuffer = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations,
      hash: 'SHA-256'
    },
    passwordKey,
    256
  );

  const rawBits = new Uint8Array(rawBitsBuffer);

  const key = await window.crypto.subtle.importKey(
    'raw',
    rawBits,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return { key, rawBits };
}

/**
 * Re-imports raw key material (e.g. from an unsealed recovery envelope) into a non-extractable CryptoKey.
 */
export async function deriveKeyFromRawBits(rawBits: Uint8Array): Promise<CryptoKey> {
  return window.crypto.subtle.importKey(
    'raw',
    rawBits as unknown as BufferSource,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Validates and normalizes an entered 24-word emergency recovery phrase.
 * Checks whitespace, word count, and dictionary membership against RECOVERY_WORDS.
 */
export function validateRecoveryPhrase(phraseInput: string): {
  isValid: boolean;
  normalizedPhrase: string;
  normalizedWords: string[];
  error?: string;
  invalidWords: string[];
} {
  if (!phraseInput || !phraseInput.trim()) {
    return {
      isValid: false,
      normalizedPhrase: '',
      normalizedWords: [],
      error: 'Please enter your 24-word emergency recovery phrase.',
      invalidWords: []
    };
  }

  // Normalize: lower case, collapse all whitespace, tabs, and newlines
  const words = phraseInput
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const dictSet = new Set(RECOVERY_WORDS.map(w => w.toLowerCase()));
  const invalidWords: string[] = [];

  for (const w of words) {
    if (!dictSet.has(w)) {
      invalidWords.push(w);
    }
  }

  if (words.length !== 24) {
    return {
      isValid: false,
      normalizedPhrase: words.join(' '),
      normalizedWords: words,
      error: `Phrase must contain exactly 24 words (currently ${words.length} words entered).`,
      invalidWords
    };
  }

  if (invalidWords.length > 0) {
    const wordList = invalidWords.map(w => `"${w}"`).join(', ');
    return {
      isValid: false,
      normalizedPhrase: words.join(' '),
      normalizedWords: words,
      error: `Unrecognized recovery word(s) detected: ${wordList}. Please verify spelling.`,
      invalidWords
    };
  }

  return {
    isValid: true,
    normalizedPhrase: words.join(' '),
    normalizedWords: words,
    invalidWords: []
  };
}

/**
 * Derives a CryptoKey from a 24-word emergency recovery phrase.
 */
export async function deriveKeyFromRecoveryPhrase(
  phrase: string[] | string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const normalizedPhrase = Array.isArray(phrase) 
    ? phrase.join(' ').trim().toLowerCase() 
    : phrase.trim().toLowerCase();
  return deriveKeyFromPassphrase(normalizedPhrase, salt, PBKDF2_ITERATIONS);
}

export interface EncryptedPayload {
  ciphertext: string; // Base64
  iv: string;         // Base64
  version: number;
}

/**
 * Creates an authenticated Zero-Knowledge Recovery Envelope.
 * Encrypts the raw vault root key bytes under the 24-word recovery key.
 */
export async function createRecoveryEnvelope(
  rawVaultKeyBits: Uint8Array,
  recoveryKey: CryptoKey
): Promise<EncryptedPayload> {
  const payload = {
    rawKey: uint8ArrayToBase64(rawVaultKeyBits),
    magic: AUTH_SENTINEL_MAGIC,
    createdAt: Date.now()
  };
  return encryptPayload(payload, recoveryKey);
}

/**
 * Unseals a Zero-Knowledge Recovery Envelope using the 24-word recovery key.
 * Verifies the AES-GCM MAC tag and authentication magic before returning raw key bytes.
 */
export async function unsealRecoveryEnvelope(
  envelope: EncryptedPayload,
  recoveryKey: CryptoKey
): Promise<Uint8Array> {
  const decrypted = await decryptPayload<{ rawKey: string; magic: string }>(envelope, recoveryKey);
  if (!decrypted || decrypted.magic !== AUTH_SENTINEL_MAGIC || !decrypted.rawKey) {
    throw new Error('Recovery envelope authentication failed: Tampered or invalid key material.');
  }
  return base64ToUint8Array(decrypted.rawKey);
}

/**
 * Encrypts an arbitrary object using AES-256-GCM.
 */
export async function encryptPayload(data: unknown, key: CryptoKey): Promise<EncryptedPayload> {
  const iv = new Uint8Array(IV_BYTE_LENGTH);
  window.crypto.getRandomValues(iv);

  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));

  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    plaintext
  );

  return {
    ciphertext: uint8ArrayToBase64(new Uint8Array(cipherBuffer)),
    iv: uint8ArrayToBase64(iv),
    version: 1
  };
}

/**
 * Decrypts an AES-256-GCM encrypted payload back into its typed object.
 */
export async function decryptPayload<T>(payload: EncryptedPayload, key: CryptoKey): Promise<T> {
  const iv = base64ToUint8Array(payload.iv);
  const ciphertext = base64ToUint8Array(payload.ciphertext);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource
    },
    key,
    ciphertext as unknown as BufferSource
  );

  const decoder = new TextDecoder();
  const jsonString = decoder.decode(decryptedBuffer);
  return JSON.parse(jsonString) as T;
}

export const AUTH_SENTINEL_MAGIC = 'vaultora-auth-verified-v1';

/**
 * Creates an encrypted sentinel to verify master key validity without storing raw passwords or keys.
 */
export async function createAuthSentinel(key: CryptoKey): Promise<EncryptedPayload> {
  return encryptPayload({ magic: AUTH_SENTINEL_MAGIC, createdAt: Date.now() }, key);
}

/**
 * Verifies whether a derived key is authorized by attempting AES-GCM decryption on the sentinel.
 * If authentication tag fails or magic doesn't match, returns false.
 */
export async function verifyAuthSentinel(sentinel: EncryptedPayload, key: CryptoKey): Promise<boolean> {
  try {
    const decrypted = await decryptPayload<{ magic: string }>(sentinel, key);
    return decrypted?.magic === AUTH_SENTINEL_MAGIC;
  } catch {
    return false;
  }
}

/**
 * Best-effort zeroization of sensitive typed arrays in client memory.
 */
export function zeroizeBuffer(buffer: Uint8Array): void {
  try {
    buffer.fill(0);
  } catch {
    // Ignore
  }
}

/**
 * Comprehensive Vault Backup Payload containing vault items and configuration
 */
export interface VaultBackupPayload {
  formatVersion: 2;
  app: 'Vaultora';
  appVersion: string;
  exportedAt: string;
  items: unknown[];
  workspaces?: unknown[];
  settings?: {
    autoLockMinutes?: number;
    biometricsEnabled?: boolean;
  };
  stats?: {
    itemCount: number;
    workspaceCount: number;
  };
}

export const CURRENT_BACKUP_SCHEMA_VERSION = 2;
export const MAX_SUPPORTED_BACKUP_VERSION = 2;

/**
 * Package for portable encrypted vault backups (.vaultora format)
 */
export interface EncryptedVaultArchive {
  vaultoraEncrypted: true;
  version: number;
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  cipher: 'AES-256-GCM';
  salt: string; // Base64
  iv: string;   // Base64
  ciphertext: string; // Base64
  exportedAt: string;
  appVersion?: string;
  summary?: {
    itemCount: number;
    workspaceCount: number;
  };
}

export interface BackupValidationResult {
  isValid: boolean;
  version: number;
  iterations: number;
  exportedAt: string;
  appVersion?: string;
  summary?: {
    itemCount: number;
    workspaceCount: number;
  };
  error?: string;
}

/**
 * Validates a backup archive header before attempting computationally intensive PBKDF2 key derivation.
 * Safely rejects malformed, unencrypted, or version-incompatible files.
 */
export function validateBackupArchiveHeader(rawJsonOrObject: unknown): {
  archive: EncryptedVaultArchive;
  summary?: { itemCount: number; workspaceCount: number };
} {
  let archive: any;
  if (typeof rawJsonOrObject === 'string') {
    try {
      archive = JSON.parse(rawJsonOrObject);
    } catch {
      throw new Error('Malformed backup file: Invalid JSON syntax.');
    }
  } else if (rawJsonOrObject && typeof rawJsonOrObject === 'object') {
    archive = rawJsonOrObject;
  } else {
    throw new Error('Invalid backup file: Expected an object or JSON string.');
  }

  if (!archive || typeof archive !== 'object') {
    throw new Error('Invalid backup file: Empty or non-object content.');
  }

  if (archive.vaultoraEncrypted !== true) {
    throw new Error('Unencrypted or unrecognized backup file: Missing vaultoraEncrypted envelope.');
  }

  if (typeof archive.version !== 'number' || archive.version < 1) {
    throw new Error('Invalid backup format: Missing or corrupt version header.');
  }

  if (archive.version > MAX_SUPPORTED_BACKUP_VERSION) {
    throw new Error(
      `Incompatible backup format version: Archive is v${archive.version}, but this app supports up to v${MAX_SUPPORTED_BACKUP_VERSION}. Please update Vaultora.`
    );
  }

  if (archive.cipher && archive.cipher !== 'AES-256-GCM') {
    throw new Error(`Unsupported cipher suite: "${archive.cipher}". Only AES-256-GCM is supported.`);
  }

  if (!archive.salt || typeof archive.salt !== 'string' || archive.salt.length < 16) {
    throw new Error('Malformed backup archive: Missing or invalid cryptographic salt.');
  }

  if (!archive.iv || typeof archive.iv !== 'string' || archive.iv.length < 12) {
    throw new Error('Malformed backup archive: Missing or invalid cryptographic IV.');
  }

  if (!archive.ciphertext || typeof archive.ciphertext !== 'string' || archive.ciphertext.length === 0) {
    throw new Error('Malformed backup archive: Ciphertext is empty or corrupted.');
  }

  return {
    archive: archive as EncryptedVaultArchive,
    summary: archive.summary
  };
}

export async function exportEncryptedVaultArchive(
  data: unknown, 
  passphrase: string,
  summary?: { itemCount: number; workspaceCount: number }
): Promise<string> {
  const salt = generateSalt(SALT_BYTE_LENGTH);
  const key = await deriveKeyFromPassphrase(passphrase, salt, PBKDF2_ITERATIONS);
  const payload = await encryptPayload(data, key);

  const archive: EncryptedVaultArchive = {
    vaultoraEncrypted: true,
    version: CURRENT_BACKUP_SCHEMA_VERSION,
    kdf: 'PBKDF2-SHA256',
    iterations: PBKDF2_ITERATIONS,
    cipher: 'AES-256-GCM',
    salt: uint8ArrayToBase64(salt),
    iv: payload.iv,
    ciphertext: payload.ciphertext,
    exportedAt: new Date().toISOString(),
    appVersion: '1.0.0',
    summary
  };

  return JSON.stringify(archive, null, 2);
}

export async function decryptEncryptedVaultArchive<T>(
  rawJsonOrObject: string | EncryptedVaultArchive, 
  passphrase: string
): Promise<T> {
  const { archive } = validateBackupArchiveHeader(rawJsonOrObject);

  const salt = base64ToUint8Array(archive.salt);
  const key = await deriveKeyFromPassphrase(passphrase, salt, archive.iterations || PBKDF2_ITERATIONS);
  
  try {
    return await decryptPayload<T>({
      ciphertext: archive.ciphertext,
      iv: archive.iv,
      version: archive.version
    }, key);
  } catch (err: any) {
    throw new Error('Decryption failed: Authentication tag verification failed. The archive may have been modified or corrupted, or an incorrect password was entered.');
  }
}

