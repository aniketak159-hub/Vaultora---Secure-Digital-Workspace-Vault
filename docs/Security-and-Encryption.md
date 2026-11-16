# Security and Encryption Specification — Vaultora

**Document:** Security Architecture, Cryptography, and Platform Hardening  
**Target Product:** Vaultora — Secure Digital Workspace & Vault  
**Repository:** [aniketak159-hub/Vaultora---Secure-Digital-Workspace-Vault](https://github.com/aniketak159-hub/Vaultora---Secure-Digital-Workspace-Vault)  
**Android Identifier:** `io.vaultora.app`  
**Last Cryptographic Audit & Verification:** October 2026  

---

## Table of Contents

1. [Security Architecture & Threat Model](#1-security-architecture--threat-model)
   - [1.1 Security Objectives](#11-security-objectives)
   - [1.2 Threat Model & Boundaries](#12-threat-model--boundaries)
   - [1.3 Out-of-Scope Threats (What Vaultora Cannot Protect Against)](#13-out-of-scope-threats-what-vaultora-cannot-protect-against)
2. [Cryptographic Primitives & Specifications](#2-cryptographic-primitives--specifications)
   - [2.1 Summary Matrix](#21-summary-matrix)
   - [2.2 Standard Conformance](#22-standard-conformance)
3. [Key Derivation & Master Passphrase](#3-key-derivation--master-passphrase)
   - [3.1 PBKDF2-HMAC-SHA-256 Implementation](#31-pbkdf2-hmac-sha-256-implementation)
   - [3.2 Salt Generation & Lifecycle](#32-salt-generation--lifecycle)
   - [3.3 Zero-Knowledge Auth Sentinel Verification](#33-zero-knowledge-auth-sentinel-verification)
   - [3.4 Master Passphrase Rotation Workflow](#34-master-passphrase-rotation-workflow)
4. [Authenticated Encryption at Rest (AES-256-GCM)](#4-authenticated-encryption-at-rest-aes-256-gcm)
   - [4.1 Galois/Counter Mode (GCM) Specification](#41-galoiscounter-mode-gcm-specification)
   - [4.2 Nonce / Initialization Vector (IV) Uniqueness](#42-nonce--initialization-vector-iv-uniqueness)
   - [4.3 Authentication Tag Handling & Tamper Detection](#43-authentication-tag-handling--tamper-detection)
   - [4.4 Web Crypto API Key Non-Extractability](#44-web-crypto-api-key-non-extractability)
5. [Emergency Recovery Architecture (24-Word Envelope)](#5-emergency-recovery-architecture-24-word-envelope)
   - [5.1 BIP-39 Entropy & Dictionary Generation](#51-bip-39-entropy--dictionary-generation)
   - [5.2 Recovery Envelope Design (`vaultora_recovery_envelope_v2`)](#52-recovery-envelope-design-vaultora_recovery_envelope_v2)
   - [5.3 Emergency Unsealing & Key Reconstruction Flow](#53-emergency-unsealing--key-reconstruction-flow)
   - [5.4 Recovery Phrase Rotation & Verification](#54-recovery-phrase-rotation--verification)
6. [Encrypted Backup & Portability (`.vaultora`)](#6-encrypted-backup--portability-vaultora)
   - [6.1 File Structure & Schema Version 2](#61-file-structure--schema-version-2)
   - [6.2 Header Validation & Pre-Derivation Sanitization](#62-header-validation--pre-derivation-sanitization)
   - [6.3 Decryption & Restoration Safeguards](#63-decryption--restoration-safeguards)
7. [Session Security, Auto-Lock, & Memory Protection](#7-session-security-auto-lock--memory-protection)
   - [7.1 In-Memory Secret Lifecycle](#71-in-memory-secret-lifecycle)
   - [7.2 Inactivity Auto-Lock Engine](#72-inactivity-auto-lock-engine)
   - [7.3 Cryptographic Memory Purging](#73-cryptographic-memory-purging)
   - [7.4 Clipboard Security (30-Second Auto-Clear)](#74-clipboard-security-30-second-auto-clear)
   - [7.5 Rate Limiting & Brute-Force Delay](#75-rate-limiting--brute-force-delay)
8. [Android Platform Security & OS Hardening](#8-android-platform-security--os-hardening)
   - [8.1 Manifest Restrictions & Backup Shielding](#81-manifest-restrictions--backup-shielding)
   - [8.2 Screenshot & Task-Switcher Blocking (`FLAG_SECURE`)](#82-screenshot--task-switcher-blocking-flag_secure)
   - [8.3 Sandboxed WebView & Virtual Domain Isolation](#83-sandboxed-webview--virtual-domain-isolation)
   - [8.4 Android KeyStore Hardware Bridge](#84-android-keystore-hardware-bridge)
9. [Zero-Knowledge Proof & Network Privacy Audit](#9-zero-knowledge-proof--network-privacy-audit)
   - [9.1 Zero-Telemetry Verification](#91-zero-telemetry-verification)
   - [9.2 Storage Layer Isolation (IndexedDB vs. LocalStorage)](#92-storage-layer-isolation-indexeddb-vs-localstorage)
10. [Automated Verification & Cryptographic Test Results](#10-automated-verification--cryptographic-test-results)
    - [10.1 Recovery E2E Test Suite](#101-recovery-e2e-test-suite)
    - [10.2 Persistence & Storage Failure Test Suite](#102-persistence--storage-failure-test-suite)
11. [Known Limitations & Responsible Disclosure](#11-known-limitations--responsible-disclosure)
    - [11.1 Platform & Operational Limitations](#111-platform--operational-limitations)
    - [11.2 Vulnerability Reporting Policy](#112-vulnerability-reporting-policy)

---

## 1. Security Architecture & Threat Model

Vaultora is engineered around a strict **zero-knowledge, client-side cryptographic architecture**. The master passphrase, encryption keys, plaintext credentials, and recovery secrets are never transmitted, stored on remote servers, or written unencrypted to persistent device storage.

### 1.1 Security Objectives

1. **Confidentiality:** Plaintext passwords, secure notes, client workspace entries, and emergency recovery keys must never exist in persistent storage or unencrypted network transmissions.
2. **Data Integrity & Authenticity:** All vault records and backup files must use authenticated encryption (AEAD). Any unauthorized bit modification, file corruption, or database tampering must be caught and rejected before data processing.
3. **Zero-Knowledge Isolation:** Neither third-party cloud providers, network eavesdroppers, nor operating system backup utilities can inspect or reconstruct vault secrets.
4. **Resilient Recovery:** Users who forget their master passphrase can independently recover their vault records using a cryptographically sealed 24-word emergency recovery envelope, without requiring assistance from an external server.

```
+-------------------------------------------------------------------------+
|                           USER DEVICE RUNTIME                           |
|                                                                         |
|  +--------------------+         PBKDF2-HMAC-SHA-256                     |
|  | Master Passphrase  | ------> [ 600,000 Iterations ]                  |
|  +--------------------+         + 256-bit Random Salt                   |
|                                         |                               |
|                                         v                               |
|                             +-----------------------+                   |
|                             |  256-bit CryptoKey   |                   |
|                             |  (Volatile RAM Only)  |                   |
|                             +-----------------------+                   |
|                                         |                               |
|                    +--------------------+--------------------+          |
|                    |                                         |          |
|                    v                                         v          |
|        +-----------------------+                 +--------------------+ |
|        | Authenticated Decrypt |                 | Emergency Envelope | |
|        | AES-256-GCM (96b IV)  |                 | Unseal / Re-seal   | |
|        +-----------------------+                 +--------------------+ |
|                    |                                                    |
|                    v                                                    |
|        +-----------------------+                                        |
|        | IndexedDB / LocalDisk |                                        |
|        | (Ciphertext Only)     |                                        |
|        +-----------------------+                                        |
+-------------------------------------------------------------------------+
```

### 1.2 Threat Model & Boundaries

Vaultora is designed to protect user secrets against the following adversary models:

* **Stolen or Lost Device (Offline Storage Extraction):** An attacker gains physical access to the device while it is locked or powered off. The attacker extracts the local application storage (IndexedDB, SQLite, or web preferences).  
  *Protection:* All vault entries, workspaces, and emergency envelopes are encrypted at rest with AES-256-GCM using keys derived with 600,000 PBKDF2 iterations. An attacker must perform an offline brute-force attack against PBKDF2 with no shortcuts.
* **Malicious Network / Wi-Fi Eavesdropping (Man-in-the-Middle):** An attacker intercepts network traffic between the device and the internet.  
  *Protection:* Vaultora operates 100% locally. Zero credential or key synchronization requests are dispatched across the network.
* **Unauthorized OS Cloud Backup Extraction:** Automated mobile backup services (e.g., Google Cloud Backup, ADB) attempt to copy application databases to remote clouds.  
  *Protection:* Android manifests enforce `android:allowBackup="false"`.
* **Visual Snooping & Background App Preview Capture:** Operating system task switchers take screenshot snapshots of backgrounded applications.  
  *Protection:* Android `WindowManager.LayoutParams.FLAG_SECURE` disables screen capture and blank-masks app switcher preview thumbnails.

### 1.3 Out-of-Scope Threats (What Vaultora Cannot Protect Against)

Like all client-side security software, Vaultora's security boundary relies on the integrity of the underlying host operating system and hardware. Vaultora cannot protect against:

* **Compromised Host OS / Active Malware:** Malware with root access, kernel-level keyloggers, or memory injection frameworks running on the device can capture passphrases at input time or inspect process memory while the vault is actively unlocked.
* **Physical Access to an Unlocked Device:** If an attacker obtains an unlocked device while an active session has not reached its auto-lock timeout, the attacker can view records displayed in the UI.
* **Malicious Browser Extensions with Elevated Privileges:** In desktop browser environments, extensions granted universal page DOM access (`<all_urls>`) can read form fields or intercept keystrokes prior to Web Crypto processing. Users are advised to run Vaultora in a dedicated browser profile or as an installed standalone PWA.
* **Forgotten Passphrase Without Emergency Kit:** Because Vaultora employs strict zero-knowledge architecture, there is no back-door, master key, or server-side password reset. If a user loses both their master passphrase and their 24-word emergency recovery phrase, data recovery is mathematically impossible.

---

## 2. Cryptographic Primitives & Specifications

### 2.1 Summary Matrix

| Security Domain | Primitive / Algorithm | Standard / Parameters | Source File Reference |
| :--- | :--- | :--- | :--- |
| **Symmetric Encryption** | AES-GCM (Galois/Counter Mode) | 256-bit key length (`AES-GCM-256`) | `/src/crypto/cryptoService.ts` |
| **Nonce / IV** | CSPRNG `crypto.getRandomValues` | 96-bit (12 bytes) unique per operation | `/src/crypto/cryptoService.ts` |
| **Authentication Tag** | GCM Auth Tag | 128-bit integrity tag | `/src/crypto/cryptoService.ts` |
| **Key Derivation (KDF)** | PBKDF2 with HMAC-SHA-256 | **600,000 iterations**, 256-bit salt | `/src/crypto/cryptoService.ts` |
| **Passphrase Verification** | Authenticated Sentinel | Zero-knowledge AES-256-GCM sentinel token | `/src/crypto/cryptoService.ts` |
| **Emergency Seed Phrase** | BIP-39 Standard Dictionary | 24 words (256-bit entropy) | `/src/crypto/cryptoService.ts` |
| **Recovery Envelope** | AES-256-GCM sealed envelope | Format: `vaultora_recovery_envelope_v2` | `/src/crypto/cryptoService.ts` |
| **Backup Archive** | Authenticated JSON Container | Schema Version 2 (`.vaultora`) | `/src/crypto/cryptoService.ts` |
| **Mobile Hardware Key** | Android KeyStore Provider | AES-256-GCM hardware key | `/android/app/.../MainActivity.java` |
| **OS Screen Protection** | Android Window Manager | `FLAG_SECURE` | `/android/app/.../MainActivity.java` |

### 2.2 Standard Conformance

Vaultora relies exclusively on standard cryptographic implementations provided by the **W3C Web Cryptography API (`window.crypto.subtle`)** and the **Android KeyStore Provider**. It deliberately does not use proprietary, non-standard, or unaudited rolling crypto algorithms.

---

## 3. Key Derivation & Master Passphrase

### 3.1 PBKDF2-HMAC-SHA-256 Implementation

Master passphrase derivation uses the Password-Based Key Derivation Function 2 (PBKDF2) specified in RFC 8018 / PKCS #5 v2.1:

```typescript
// Verified implementation from /src/crypto/cryptoService.ts
export const PBKDF2_ITERATIONS = 600000;
export const SALT_BYTE_LENGTH = 32;

export async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey', 'deriveBits']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // Non-extractable
    ['encrypt', 'decrypt']
  );
}
```

* **Iteration Count (600,000):** Meets and exceeds current OWASP Password Storage guidelines for PBKDF2-HMAC-SHA-256 to impose substantial computational costs on GPU and ASIC password cracking rigs.
* **Hash Function (SHA-256):** Provides a 256-bit block digest with complete collision resistance.
* **Key Length (256 bits):** Generates symmetric key material matching the security level of AES-256.

### 3.2 Salt Generation & Lifecycle

* A cryptographically secure 256-bit (32 bytes) random salt is generated upon vault creation using `window.crypto.getRandomValues(new Uint8Array(32))`.
* The salt is stored in application persistence (`vaultora_master_salt`) as a Base64-encoded string.
* Because the salt is public parameter material, storing it does not weaken security; its function is to prevent rainbow table pre-computation and force adversaries to crack vaults individually.
* When the master passphrase is changed, a fresh 32-byte salt is generated.

### 3.3 Zero-Knowledge Auth Sentinel Verification

Vaultora never stores the master passphrase, nor does it store an unsalted or raw cryptographic hash of the passphrase. Instead, it utilizes an **Authenticated Auth Sentinel** pattern (`AUTH_SENTINEL_MAGIC = "VAULTORA_AUTH_SENTINEL_V1"`):

```
Passphrase Input
      |
      v
PBKDF2-HMAC-SHA256 (600,000 iter, Salt)
      |
      v
Derived AES-256 Key
      |
      v
Attempt Decrypt: Auth Sentinel Ciphertext
   (Payload: "VAULTORA_AUTH_SENTINEL_V1")
      |
      +-----> Valid GCM Tag & Matches Magic String: SUCCESS (Vault Unlocked)
      |
      +-----> Invalid GCM Tag: MAC Validation Fails (Wrong Passphrase Rejected)
```

1. **Setup:** The app derives the vault key and uses AES-256-GCM to encrypt the magic string `"VAULTORA_AUTH_SENTINEL_V1"` with a dedicated 96-bit IV. The resulting ciphertext and IV are saved in storage (`vaultora_auth_sentinel`).
2. **Verification on Unlock:** The user enters their passphrase. The app derives a candidate key using the stored salt and attempts to decrypt the sentinel.
3. **Cryptographic Tag Check:** If the passphrase is incorrect by even a single bit, AES-GCM's 128-bit GMAC authentication tag verification fails. The Web Crypto API rejects the operation with an `OperationError`.
4. **Zero Information Leak:** The candidate key is discarded immediately. No secret state is exposed.

### 3.4 Master Passphrase Rotation Workflow

Rotating the master passphrase is a zero-downtime, fully verified operation:

1. **Pre-Authentication:** The user must enter their existing master passphrase to unlock and decrypt all vault items into memory.
2. **Fresh Derivation:** A new 32-byte salt is generated, and a new 256-bit key is derived from the new passphrase using 600,000 PBKDF2 iterations.
3. **Atomic Re-encryption:** All vault items, client workspaces, and audit logs are re-encrypted under the new key, each with a fresh 96-bit random IV.
4. **Sentinel & Envelope Re-sealing:** A new auth sentinel is created for the new key, and the existing 24-word emergency recovery envelope is unsealed with the recovery phrase and re-sealed over the new vault root key.
5. **Unlock Verification:** The new credentials and envelope are verified against the newly written records before retiring the old state. If any step fails, the original encrypted vault remains intact.

---

## 4. Authenticated Encryption at Rest (AES-256-GCM)

### 4.1 Galois/Counter Mode (GCM) Specification

All sensitive vault payloads (passwords, private notes, recovery envelopes, and workspace archives) are encrypted using **AES-256-GCM** (NIST SP 800-38D).

GCM is an Authenticated Encryption with Associated Data (AEAD) algorithm combining:
1. **CTR (Counter Mode) Encryption:** Provides high-performance symmetric confidentiality.
2. **GHASH Authenticator:** Computes a 128-bit authentication tag over the ciphertext and nonce.

```typescript
export interface EncryptedPayload {
  ciphertext: string; // Base64 encoded ciphertext + tag
  iv: string;         // Base64 encoded 96-bit IV
}
```

### 4.2 Nonce / Initialization Vector (IV) Uniqueness

* **Requirement:** Reusing an IV with the same key in AES-GCM destroys the authenticity guarantees of GHASH and can reveal plaintext XOR differences.
* **Enforcement:** Every encryption invocation generates a fresh 96-bit (12 bytes) IV via `window.crypto.getRandomValues(new Uint8Array(12))`:
  ```typescript
  export const IV_BYTE_LENGTH = 12; // 96 bits standard for AES-GCM
  
  export async function encryptPayload<T>(data: T, key: CryptoKey): Promise<EncryptedPayload> {
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_BYTE_LENGTH));
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoded
    );
    return {
      ciphertext: uint8ArrayToBase64(new Uint8Array(encrypted)),
      iv: uint8ArrayToBase64(iv)
    };
  }
  ```
* Automated tests verify that repeated edits to the same vault record always produce distinct, uncorrelated IVs.

### 4.3 Authentication Tag Handling & Tamper Detection

The Web Crypto API automatically appends a 128-bit (16 bytes) authentication tag to the ciphertext array upon encryption and validates it prior to returning plaintext upon decryption:

```typescript
export async function decryptPayload<T>(payload: EncryptedPayload, key: CryptoKey): Promise<T> {
  const iv = base64ToUint8Array(payload.iv);
  const data = base64ToUint8Array(payload.ciphertext);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    data
  );
  return JSON.parse(new TextDecoder().decode(decrypted));
}
```

If an attacker flips a single bit in the ciphertext or modifies the IV in storage, `subtle.decrypt` immediately rejects the operation with an unhandled `OperationError`. Vaultora traps this error, logs a security warning, and preserves the encrypted data on disk without overwriting it.

### 4.4 Web Crypto API Key Non-Extractability

When keys are derived in volatile memory, the `extractable` parameter is set to `false`:

```typescript
// extractable: false prevents programmatic export of raw key bits
window.crypto.subtle.deriveKey(
  ...,
  false, // Non-extractable
  ['encrypt', 'decrypt']
);
```

Non-extractable keys cannot be serialized or exported via `window.crypto.subtle.exportKey()`. They exist only as an opaque handle inside the browser's cryptographic execution context.

---

## 5. Emergency Recovery Architecture (24-Word Envelope)

To guarantee that users can always regain access to their data without compromising the zero-knowledge model, Vaultora implements a **24-word BIP-39 emergency recovery envelope** identified as `vaultora_recovery_envelope_v2`.

```
=============================================================================
                  VAULTORA 24-WORD EMERGENCY ENVELOPE (v2)
=============================================================================

1. Emergency Setup:
   256-bit CSPRNG Entropy  ===>  24-Word BIP-39 Recovery Phrase
                                            |
                                            v
                                 PBKDF2-HMAC-SHA-256 (600,000 Rounds)
                                 + Envelope Salt (32 bytes)
                                            |
                                            v
                                 Recovery Key (AES-256-GCM)
                                            |
   Vault Root Key (256 bits) -------------> + ===> Sealed Recovery Envelope

2. Recovery Execution:
   User Inputs 24 Words
            |
            v
   Normalize (trim, lowercase, 24-word count, dictionary check)
            |
            v
   Derive Recovery Key (PBKDF2-HMAC-SHA-256, 600k rounds, Envelope Salt)
            |
            v
   Decrypt Recovery Envelope (AES-256-GCM, 128-bit GMAC check)
            |
            +-----> Authenticated? 
                    YES: Unseal 256-bit Root Key ===> Full Vault Unlocked
                    NO:  Throw Decryption Failure (Invalid phrase or tampered envelope)
=============================================================================
```

### 5.1 BIP-39 Entropy & Dictionary Generation

* **Entropy:** 256 bits of cryptographically secure random entropy generated via `window.crypto.getRandomValues(new Uint8Array(32))`.
* **Dictionary:** Uses the official BIP-39 English wordlist (2,048 standardized words).
* **Word Generation:** 24 words are selected using modulo mapping over the uniform 256-bit entropy buffer.
* **Input Normalization:** The recovery input parser automatically strips extraneous whitespace, normalizes multiple spaces, converts all letters to lowercase, and validates that every word belongs to the BIP-39 dictionary.

### 5.2 Recovery Envelope Design (`vaultora_recovery_envelope_v2`)

The sealed recovery envelope stored in `vaultora_recovery_envelope_v2` consists of:

```json
{
  "version": 2,
  "kdfAlgorithm": "PBKDF2-HMAC-SHA256",
  "iterations": 600000,
  "salt": "<Base64 encoded 32-byte salt>",
  "iv": "<Base64 encoded 12-byte IV>",
  "encryptedKey": "<Base64 encoded ciphertext + 128-bit GCM tag>"
}
```

* `encryptedKey` encapsulates the raw 256-bit vault root key.
* The recovery key used to seal the envelope is derived from the 24 words using 600,000 iterations of PBKDF2-HMAC-SHA-256 with an independent, dedicated 32-byte salt.

### 5.3 Emergency Unsealing & Key Reconstruction Flow

When a user initiates emergency recovery:

1. The user inputs their 24 words.
2. The input is normalized and validated against the BIP-39 wordlist.
3. The envelope salt and IV are read from `vaultora_recovery_envelope_v2`.
4. A recovery key is derived from the normalized phrase (600,000 iterations).
5. The recovery key unseals `encryptedKey` via AES-256-GCM.
6. The unsealed raw bytes are imported as a live `CryptoKey` into memory.
7. The reconstructed key is verified against `vaultora_auth_sentinel`.
8. Once verified, all vault records and workspaces are decrypted. The user is prompted to establish a new master passphrase.

### 5.4 Recovery Phrase Rotation & Verification

Displaying a new phrase in the UI does **not** constitute rotation. Vaultora requires active re-sealing:
* When a user requests a new recovery phrase in Settings, the application generates 24 new words.
* It unseals the current root key in memory, re-derives a new envelope key from the new words with a fresh 32-byte salt, and seals a replacement envelope.
* The old phrase becomes immediately invalid.

---

## 6. Encrypted Backup & Portability (`.vaultora`)

### 6.1 File Structure & Schema Version 2

Vaultora supports offline encrypted backups saved with the `.vaultora` extension. The export format is an authenticated JSON container containing a public metadata header and an encrypted payload:

```json
{
  "vaultoraBackup": true,
  "version": 2,
  "appName": "Vaultora",
  "exportedAt": "2026-10-28T05:43:00.000Z",
  "kdfAlgorithm": "PBKDF2-HMAC-SHA256",
  "kdfIterations": 600000,
  "salt": "u9j... [Base64 32 bytes]",
  "iv": "x82... [Base64 12 bytes]",
  "ciphertext": "8km... [Base64 ciphertext + 128-bit tag]"
}
```

Inside the encrypted `ciphertext`, the decrypted payload contains:
* `items`: All encrypted vault records.
* `workspaces`: All client workspaces and organization structures.
* `settings`: Non-sensitive vault preferences (auto-lock timeout, theme, clipboard timeout).
* `schemaVersion`: Internal data model versioning.

### 6.2 Header Validation & Pre-Derivation Sanitization

Before attempting computationally intensive PBKDF2 key derivation or decrypting an imported backup file, Vaultora validates the archive header:

```typescript
export function validateBackupArchiveHeader(fileData: any): { valid: boolean; error?: string } {
  if (!fileData || typeof fileData !== 'object') {
    return { valid: false, error: 'File is not a valid JSON structure.' };
  }
  if (!fileData.vaultoraBackup) {
    return { valid: false, error: 'Not a recognized Vaultora backup file.' };
  }
  if (fileData.version > CURRENT_BACKUP_SCHEMA_VERSION) {
    return { 
      valid: false, 
      error: `Unsupported backup version (${fileData.version}). Please update Vaultora.` 
    };
  }
  if (!fileData.salt || !fileData.iv || !fileData.ciphertext) {
    return { valid: false, error: 'Backup archive is missing critical cryptographic fields.' };
  }
  return { valid: true };
}
```

### 6.3 Decryption & Restoration Safeguards

1. **Password Authentication:** The backup password is used to derive a temporary decryption key using the salt and iterations recorded in the backup header.
2. **Atomic Integrity Check:** AES-256-GCM verifies the tag across the backup ciphertext. If the backup password is wrong or the file has been altered, decryption fails immediately without touching the active vault.
3. **Merge vs. Replace Mode:** The user is explicitly prompted to choose between:
   * **Merge (Default):** Appends non-duplicate records to the existing vault.
   * **Replace:** Safely replaces the current vault records with the imported records only after full decryption and schema validation have succeeded.

---

## 7. Session Security, Auto-Lock, & Memory Protection

### 7.1 In-Memory Secret Lifecycle

* Plaintext passwords, usernames, notes, and the volatile `CryptoKey` handle exist in memory **only** while the vault is in an unlocked state (`isLocked === false`).
* Secret keys are stored in React state (`VaultContext`) within the JavaScript heap.
* When the user locks the vault or the session times out, all decrypted objects are dereferenced, clearing them from active application scope.

### 7.2 Inactivity Auto-Lock Engine

Vaultora implements an active inactivity monitor that tracks user interactions:
* Monitored events: `mousemove`, `keydown`, `mousedown`, `touchstart`, and `scroll`.
* Supported timeout intervals: **5 minutes**, **15 minutes**, **30 minutes**, and **60 minutes**.
* If no interaction occurs within the configured duration, the application automatically invokes `lockVault()`.

### 7.3 Cryptographic Memory Purging

Upon triggering `lockVault()`:
1. `vaultKey` state is set to `null`.
2. `items` (decrypted records array) is set to an empty array `[]`.
3. `workspaces` (decrypted workspaces array) is set to an empty array `[]`.
4. `searchQuery` and `selectedItem` state are reset to blank and `null`.
5. The lock screen overlay is immediately mounted, requiring re-authentication.

*(Note on JavaScript Memory Zeroization: Due to the managed nature of modern JavaScript virtual machines and garbage collectors, memory buffers cannot be guaranteed to be immediately overwritten with zeros at the physical silicon layer. However, by clearing all variable references and enforcing non-extractable Web Crypto handles, memory reuse is expedited and access from application components is blocked.)*

### 7.4 Clipboard Security (30-Second Auto-Clear)

When a user copies a password or sensitive record to their system clipboard:
* The clipboard content is written using the asynchronous `navigator.clipboard.writeText()` API.
* An active timer is started in `VaultContext`.
* After **30 seconds**, Vaultora executes:
  ```typescript
  setTimeout(async () => {
    try {
      await navigator.clipboard.writeText('');
    } catch (e) {
      // Handled if browser tab is unfocused
    }
  }, 30000);
  ```
* A countdown banner notifies the user that the clipboard will be automatically cleared to prevent other applications or web pages from snooping on copied secrets.

### 7.5 Rate Limiting & Brute-Force Delay

To deter automated PIN or password guessing attacks against an unlocked device screen, Vaultora enforces progressive unlock delays:

| Failed Attempts | Enforced Cooldown Period |
| :--- | :--- |
| **1 – 2 attempts** | Instant retry (no delay) |
| **3 – 4 attempts** | **5 seconds** lock delay |
| **5 – 6 attempts** | **15 seconds** lock delay |
| **7 – 9 attempts** | **30 seconds** lock delay |
| **10+ attempts** | **60 seconds** progressive delay per attempt |

---

## 8. Android Platform Security & OS Hardening

**Package Identifier:** `io.vaultora.app`  
**Target SDK:** Android 14 (API 34)  
**Minimum SDK:** Android 7.0 (API 24)  

### 8.1 Manifest Restrictions & Backup Shielding

In `/android/app/src/main/AndroidManifest.xml`:

```xml
<application
    android:label="@string/app_name"
    android:icon="@drawable/ic_launcher"
    android:allowBackup="false"
    android:hardwareAccelerated="true"
    android:supportsRtl="true"
    android:usesCleartextTraffic="true"
    android:theme="@android:style/Theme.DeviceDefault.NoActionBar">
```

* **`android:allowBackup="false"`:** Explicitly prevents local SQLite/IndexedDB databases and preferences from being extracted via ADB backup tools (`adb backup`) or synced to unencrypted Google Drive application backups.

### 8.2 Screenshot & Task-Switcher Blocking (`FLAG_SECURE`)

In `/android/app/src/main/java/io/vaultora/app/MainActivity.java`:

```java
@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    requestWindowFeature(Window.FEATURE_NO_TITLE);

    // Prevent OS-level screen capture & task switcher snapshotting
    getWindow().setFlags(
        WindowManager.LayoutParams.FLAG_SECURE,
        WindowManager.LayoutParams.FLAG_SECURE
    );
    ...
}
```

* **Protection:** The OS treats the application window as secure content. Screenshots, screen recordings, and thumbnail previews in the Android Recent Apps / Task Switcher list are blanked out with a solid black window.

### 8.3 Sandboxed WebView & Virtual Domain Isolation

The Android native shell hosts the web application inside a hardened Android WebView:

* **No File URL Traversal:**
  ```java
  webSettings.setAllowFileAccess(false);
  webSettings.setAllowContentAccess(false);
  webSettings.setAllowFileAccessFromFileURLs(false);
  webSettings.setAllowUniversalAccessFromFileURLs(false);
  webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  ```
  Prevents JavaScript running inside the WebView from accessing arbitrary files on the Android filesystem.
* **Virtual Asset Domain:** Assets are served through an intercepted virtual scheme: `https://appassets.androidplatform.net/index.html`. The native `LocalAssetWebViewClient` intercepts network requests and serves packaged assets directly from the APK's compressed `assets/www` directory, completely isolating the origin from public web origins.

### 8.4 Android KeyStore Hardware Bridge

To provide hardware-backed cryptographic capability, `MainActivity.java` registers a native bridge (`VaultoraAndroidKeystore`):

```java
KeyGenParameterSpec spec = new KeyGenParameterSpec.Builder(
    KEY_ALIAS,
    KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
    .setKeySize(256)
    .build();
```

* Generates an AES-256-GCM key inside the Android KeyStore provider.
* Where supported by the physical device hardware, keys are bound to the device's **Trusted Execution Environment (TEE)** or **StrongBox Keymaster**, ensuring that private key material cannot be extracted by the host operating system even under device root conditions.

---

## 9. Zero-Knowledge Proof & Network Privacy Audit

### 9.1 Zero-Telemetry Verification

Vaultora contains **zero external network telemetry, tracking, or analytics code**:
* **Audit Result:** A complete static scan of `/src` reveals no references to Google Analytics, Mixpanel, Sentry, Segment, or external logging servers.
* **Network Inspection:** All cryptographic key generation, encryption, decryption, password generation, and backup exports execute 100% locally on the device client. The application is completely functional in offline Airplane Mode.
* The only network requests permitted are:
  1. Font loading from Google Fonts on web browsers (when online).
  2. Local APK self-hosted download verification in the Android modal on web deployments.

### 9.2 Storage Layer Isolation (IndexedDB vs. LocalStorage)

Vaultora prioritizes **IndexedDB (`vaultora_db`)** for persistent storage due to its structured storage capacity and asynchronous transactional model.

* If IndexedDB is blocked or disabled by strict browser privacy settings, Vaultora gracefully falls back to `localStorage`.
* **Data at Rest Guarantee:** Whether stored in IndexedDB or `localStorage`, the data payload is always the ciphertext output of `encryptPayload`. Plaintext passwords, unencrypted usernames, and raw keys are never written to disk under any condition.

---

## 10. Automated Verification & Cryptographic Test Results

Vaultora includes two comprehensive, automated end-to-end verification suites located in `/scripts`:
1. `scripts/test-recovery-e2e.ts` (Emergency Recovery & Envelope Unsealing Suite)
2. `scripts/test-persistence-scenarios.ts` (Data Persistence & Storage Resilience Suite)

Both suites execute in automated test environments to verify mathematical correctness.

### 10.1 Recovery E2E Test Suite

```bash
npx tsx scripts/test-recovery-e2e.ts
```

**Verified Test Results (11 of 11 Passed):**

```
===============================================================
🛡️ VAULTORA 24-WORD EMERGENCY RECOVERY E2E VERIFICATION SUITE
===============================================================

✅ PASS | Step 1: Create Vault with Test Records & AES-256-GCM
         Vault initialized with sensitive records encrypted under PBKDF2 600,000 iterations.
✅ PASS | Step 2: Generate 24-Word Phrase & Establish Recovery Envelope
         24-word phrase validated (24 words from dictionary); envelope sealed with AES-256-GCM.
✅ PASS | Step 3: Lock Vault & Verify Lost Credential Rejection
         In-memory keys wiped. Incorrect/forgotten password rejected by AES-GCM MAC tag.
✅ PASS | Step 4: Recover & Unseal Vault via Normalized 24-Word Phrase
         Messy input normalized; 256-bit vault root key unsealed successfully from recovery envelope.
✅ PASS | Step 5: Verify Original Records Decrypted & Intact
         Auth sentinel verified: true. Both sensitive records recovered byte-for-byte.
✅ PASS | Step 6: Reject Invalid Recovery Phrase
         Single-word substitution in recovery phrase failed AES-GCM MAC tag validation as expected.
✅ PASS | Step 7: Reject Tampered Recovery Envelope
         Bit-flipped ciphertext in recovery envelope rejected immediately by AES-GCM tag verification.
✅ PASS | Step 8: Recovery from Encrypted .vaultora Backup Archive
         Authenticated .vaultora backup archive exported, restored, and verified wrong password rejection.
✅ PASS | Step 9: Master Passphrase Reset Flow & Envelope Re-Sealing
         Master passphrase rotated; vault records re-encrypted; recovery envelope updated to wrap new root key.
✅ PASS | Step 10: Lock & Reopen Recovered Vault (Persistence Confirmation)
         Reopened vault with rotated credentials; all records decrypted successfully.
✅ PASS | Step 11: Backward Compatibility & Non-Destructive Legacy Migration
         Verified: (1) Un-migrated vaults without envelope fail safely without data loss, 
         (2) Normal unlock automatically migrates legacy vault by generating recovery envelope, 
         (3) Migrated vault recovers flawlessly via 24 words.

OVERALL RECOVERY E2E STATUS: 100% PASSED (ALL STEPS VERIFIED)
```

### 10.2 Persistence & Storage Failure Test Suite

```bash
npx tsx scripts/test-persistence-scenarios.ts
```

**Verified Test Results (13 of 13 Passed):**

```
===============================================================
🚀 VAULTORA SECURE STORAGE & DATA RECOVERY TEST SUITE
===============================================================

✅ PASS | 1. Create New Vault Record & Persist with AES-256-GCM
         Verified ciphertext is generated with unique 96-bit IV; zero plaintext credentials on disk.
✅ PASS | 2. Edit Record & Persist with Fresh Nonce
         Password rotated. Re-encrypted with fresh unique 96-bit nonce. Zero IV reuse confirmed.
✅ PASS | 3. Delete Record & Confirm Deletion Behavior
         Deleted target record purged from ciphertext while sibling records remain intact.
✅ PASS | 4. Cold Start & In-Memory Key Derivation (600k PBKDF2 iterations)
         All in-memory references purged. Re-derived key via PBKDF2 (600k rounds) & decrypted successfully.
✅ PASS | 5. Page Navigation & Application Reload
         Navigated across all views; encrypted vault records remained unmodified.
✅ PASS | 6. Mobile Device & Android Keystore Architecture Analysis
         allowBackup="false" verified, WebSettings traversal hardened, native KeyStore bridge verified.
✅ PASS | 7. Verify Records & Settings Retained After Reopening
         All persistent domains (ciphertext, sentinel, salt, audit trail) verified intact after reopening.
✅ PASS | 8. Offline Operation & Zero-Network Independence
         Cryptographic derivation, encryption, and backup export execute 100% locally with zero network calls.
✅ PASS | 9. Storage Failures, Wrong Password, & Tamper Detection
         Resilience verified against: wrong password, bit-flipped ciphertext, and QuotaExceededError.
✅ PASS | 10. Key Non-Extractability & In-Memory Isolation
         Verified CryptoKey created with extractable: false. Direct raw key export blocked by runtime.
✅ PASS | 11. Encrypted Backup & Restore with Settings & Portability
         Exported .vaultora archive verified zero plaintext leak. Restored records and settings perfectly.
✅ PASS | 12. Backup Version Validation & Tamper Rejection
         Incompatible future versions safely rejected before KDF; bit-flipped backups rejected by GMAC tag.
✅ PASS | 13. 24-Word Emergency Seed Recovery & Zero-Knowledge Envelope
         24-word dictionary validation, whitespace normalization, and envelope unsealing verified.

Overall Status: ALL PERSISTENCE SCENARIOS VERIFIED
```

---

## 11. Known Limitations & Responsible Disclosure

### 11.1 Platform & Operational Limitations

1. **Browser Storage Eviction:** Web browsers may clear IndexedDB or LocalStorage if the host system suffers extreme storage pressure or if the user explicitly clears browser history and website data.  
   *Mitigation:* Vaultora provides clear warnings in Settings and encourages users to regularly export encrypted `.vaultora` backup archives to external storage.
2. **Clipboard Access in Operating Systems:** While Vaultora clears the system clipboard after 30 seconds, third-party clipboard manager utilities installed on the operating system may capture and persist the copied password before the auto-clear timer expires.
3. **No Central Recovery Escrow:** If a user forgets their master passphrase and misplaces their 24-word recovery phrase, Vaultora developers and administrators have no mathematical ability to recover the data.

### 11.2 Vulnerability Reporting Policy

Vaultora welcomes responsible security disclosures from independent security researchers, cryptographers, and the open-source community.

* **Reporting Channel:** Please report suspected vulnerabilities, cryptographic flaws, or implementation bugs directly via **GitHub Private Security Advisories** on the official repository:  
  [https://github.com/aniketak159-hub/Vaultora---Secure-Digital-Workspace-Vault/security/advisories](https://github.com/aniketak159-hub/Vaultora---Secure-Digital-Workspace-Vault/security/advisories)  
  Alternatively, open an issue labeled `security` on the repository issue tracker.
* **Guideline:** Please allow reasonable time for the project maintainers to triage, reproduce, and release a patched version before disclosing technical vulnerability details publicly.
* **Scope:** Include step-by-step reproduction instructions, affected platform/browser versions, and proof-of-concept code where applicable.

---

*This document is maintained as part of the official Vaultora documentation suite in `/docs/Security-and-Encryption.md` and the GitHub Wiki.*
