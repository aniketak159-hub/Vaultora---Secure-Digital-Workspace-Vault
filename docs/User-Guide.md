# Vaultora User Guide

Welcome to the official **Vaultora User Guide**. This guide provides complete, step-by-step instructions for setting up, managing, securing, backing up, and recovering your digital vault.

Vaultora is a privacy-first, zero-knowledge password manager and secure digital workspace designed for individuals, freelancers, digital agencies, and teams. All encryption and key derivation occur exclusively on your local device.

---

## Table of Contents

1. [What Vaultora Does](#1-what-vaultora-does)
2. [First-Time Setup & Vault Initialization](#2-first-time-setup--vault-initialization)
3. [Unlocking the Vault & Biometric Access](#3-unlocking-the-vault--biometric-access)
4. [Organizing & Managing Vault Entries](#4-organizing--managing-vault-entries)
5. [Changing Your Master Passphrase](#5-changing-your-master-passphrase)
6. [Emergency Recovery Phrase (24-Word Seed)](#6-emergency-recovery-phrase-24-word-seed)
7. [Encrypted Backups (.vaultora) & Restoration](#7-encrypted-backups-vaultora--restoration)
8. [Session Timeout, Auto-Lock & Clipboard Protection](#8-session-timeout-auto-lock--clipboard-protection)
9. [Troubleshooting Common Issues](#9-troubleshooting-common-issues)
10. [Security Best Practices & Data-Loss Prevention](#10-security-best-practices--data-loss-prevention)

---

## 1. What Vaultora Does

Vaultora protects your sensitive credentials, accounts, software licences, payment cards, secure notes, and developer secrets using authenticated client-side encryption.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VAULTORA CLIENT DEVICE                          │
│                                                                        │
│   Master Passphrase ───► PBKDF2-HMAC-SHA256 (600,000 iterations)       │
│                                    │                                   │
│                                    ▼                                   │
│                             256-bit AES Key                            │
│                                    │                                   │
│                                    ▼                                   │
│                  AES-256-GCM Authenticated Encryption                  │
│                                    │                                   │
│                                    ▼                                   │
│            Encrypted Storage (IndexedDB / Local Storage)               │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Capabilities

- **Zero-Knowledge Architecture:** Cryptographic keys are derived in volatile device memory and never leave your hardware. No unencrypted records, master keys, or recovery words are ever transmitted to any external server.
- **Client Workspaces:** Organize credentials into segregated workspaces (e.g., Personal, Client Projects, Team Operations) with role-based collaborator tracking and credential-rotation flags.
- **Multi-Category Storage:** Dedicated schemas for web logins, secure notes with 2FA backup codes, software licences, travel/identity documents, Wi-Fi router configurations, payment cards, and developer API secrets.
- **Cryptographic Password Generator:** Built-in high-entropy generator supporting random passwords with custom character sets and Diceware-style multi-word passphrases.
- **Credential Health Auditing:** Real-time detection of weak passwords, reused credentials, missing multi-factor authentication, and stale logins.
- **Dual-Layer Recovery:** Protect against forgotten credentials using a standard 24-word BIP-39 emergency phrase or portable encrypted `.vaultora` backup archives.

---

## 2. First-Time Setup & Vault Initialization

When opening Vaultora for the first time on a clean browser or after installing the Android APK, the vault begins in an uninitialized state.

```
 ┌────────────────────────────────────────────────────────────┐
 │                    Initialize Vaultora                     │
 │  Create a master passphrase to seal and protect your       │
 │  private zero-knowledge vault.                             │
 └────────────────────────────────────────────────────────────┘
```

### Step-by-Step Initialization

1. **Open Vaultora:** Launch the web application or open the Android app (`io.vaultora.app`).
2. **Review Setup Screen:** The screen displays **Initialize Vaultora**.
3. **Enter Master Passphrase:** In the **Create Master Passphrase** field, enter a strong, memorable passphrase.
   - *Requirement:* Minimum 8 characters. For optimal security, 16+ characters or a 4-word passphrase is recommended.
4. **Confirm Master Passphrase:** Re-enter the exact same passphrase into the **Confirm Master Passphrase** field.
5. **Click "Create Vault & Generate Emergency Kit":**
   - Vaultora generates a cryptographically secure 256-bit random salt.
   - Derives your master encryption key using PBKDF2-HMAC-SHA256 with 600,000 rounds.
   - Creates an authenticated HMAC authentication sentinel to verify future unlocks.
   - Generates a unique 24-word emergency recovery phrase.
   - Seals the raw vault root key into a secure recovery envelope (`vaultora_recovery_envelope_v2`).
6. **Save Your Emergency Kit:** The **24-Word Recovery Kit** modal will open immediately.
   - Write down all 24 words in their exact numbered sequence (1 to 24).
   - Alternatively, click **Print Kit** to create a physical hard copy.
   - Store this copy in a secure, fireproof, offline location.
7. **Complete Setup:** Close the kit modal. Your vault is now active and ready for use.

> [!WARNING]
> **No Password Reset Exists:** Vaultora has no administrative backdoors, cloud accounts, or customer support recovery. If you forget your master passphrase, your **24-word emergency recovery phrase** is the only way to recover your data.

---

## 3. Unlocking the Vault & Biometric Access

When Vaultora is locked, all decrypted records and cryptographic keys are purged from device memory.

### Standard Passphrase Unlock

1. In the **Master Passphrase** field, type your master passphrase.
2. Click the **Eye icon** on the right side if you wish to toggle character visibility and check for typos.
3. Click the **Unlock Vault** button (or press `Enter`).
4. Vaultora re-derives your 256-bit key through 600,000 PBKDF2 iterations and verifies the cryptographic MAC tag:
   - **Success:** The vault decrypts immediately and opens your records.
   - **Failure:** Displays an error message: *"Authentication failed: Incorrect master passphrase."*

### Brute-Force Rate Limiting (Throttling)

To prevent automated guessing attacks, Vaultora enforces progressive rate limiting after consecutive failed attempts:

| Consecutive Failed Attempts | Enforced Cooldown Period | Behavior |
| :--- | :--- | :--- |
| **1 – 2 attempts** | 0 seconds | Immediate re-entry allowed |
| **3 – 4 attempts** | 5 seconds | Cooldown countdown displayed |
| **5 – 6 attempts** | 15 seconds | Cooldown countdown displayed |
| **7 – 9 attempts** | 30 seconds | Cooldown countdown displayed |
| **10+ attempts** | 60 seconds | Extended lockout timer active |

During a cooldown, the unlock button is disabled and displays the remaining seconds (e.g., *"Locked for 15s"*).

### Biometric Access & Hardware Keystore

- **Android Native App (`io.vaultora.app`):** Tap **"Unlock with Android KeyStore (TEE / StrongBox)"**. Biometric authentication operates through the Android `BiometricPrompt` API backed by your device's Trusted Execution Environment.
- **Web Browsers:** Clicking **"Biometric Unlock (Hardware Keystore / WebAuthn)"** explains platform availability. In browser environments, enter your master passphrase to unlock session keys into volatile memory.

---

## 4. Organizing & Managing Vault Entries

Vaultora organizes credentials through a three-tier hierarchy: **Workspaces**, **Collections**, and **Record Categories**.

```
Workspaces (e.g. Acme Corp Client)
  └── Collections (e.g. Hosting & DNS, Social Accounts)
        └── Vault Records (Logins, Wi-Fi, Licences, Notes)
```

### Record Categories

| Category | Primary Fields | Best Used For |
| :--- | :--- | :--- |
| **Logins & Passwords** | Username, Password, URL, 2FA/MFA status, Passkey support | Web services, portals, email accounts |
| **Secure Notes & 2FA** | Note content, 2FA recovery backup codes | Sensitive recovery codes, private memos |
| **Software Licences** | Software name, Licence key, Licensed seats, Expiry date | Desktop apps, commercial software licences |
| **Identity & Travel** | Document type (Passport, ID), Document number, Expiry date | Passports, driver's licences, national IDs |
| **Wi-Fi & Networks** | Network SSID, Wi-Fi password, Security type, Admin router URL | Office Wi-Fi, client networks, router logins |
| **Cards & Banking** | Cardholder name, Card number, Expiry, CVV, Bank routing | Corporate payment cards, bank accounts |
| **Developer Secrets** | Secret type (API token, SSH key, DB URI), Secret value, Fingerprint | API tokens, SSH private keys, database URLs |

### Creating a New Record

1. Click **New Vault Record** in the left sidebar (or bottom bar on mobile).
2. Select the **Category** tab (Login, Note, Licence, Identity, Wi-Fi, Card, or Secret).
3. Choose the target **Workspace** and **Collection**.
4. Enter the **Title** (e.g., *"Cloudflare Production"*).
5. Fill in the category-specific fields.
   - For passwords, click **Generate** to generate a random 20-character secret.
6. Add optional **Tags** separated by commas (e.g., `prod, cloud, admin`).
7. Click **Create Record**. The record is encrypted with AES-256-GCM before writing to local storage.

### Using the Cryptographic Secret Generator

To generate passwords without creating a new record:

1. Click **Generator** in the top navigation bar.
2. Select between:
   - **Password Mode:** Configure character length (8 to 64), uppercase, lowercase, numbers, symbols, and ambiguous character avoidance (`l`, `1`, `I`, `0`, `O`).
   - **Passphrase Mode:** Configure word count (3 to 8 words), custom separator (`-`, `.`, `_`), and word capitalization.
3. Check the real-time entropy score and crack-time estimate.
4. Click **Copy Secret** to copy the value to your clipboard.

### Managing Workspaces & Client Accounts

Workspaces isolate records for different clients or teams:

1. Click **Workspaces** in the navigation bar.
2. Click **Create Workspace** to define a new client container with custom accent colors.
3. Add custom collections (e.g., *"Hosting & DNS"*, *"Marketing Portals"*).
4. Add team collaborators with roles (`viewer`, `editor`, or `admin`).
5. **Offboarding / Revoking Access:** When revoking a collaborator's access, Vaultora can automatically flag all login credentials in that workspace with a **"Needs Rotation"** warning badge.

---

## 5. Changing Your Master Passphrase

Changing your master passphrase re-encrypts your vault records under a freshly derived cryptographic key and updates the recovery envelope.

### Step-by-Step Passphrase Rotation

1. Open **Settings** from the navigation bar or sidebar.
2. Select the **Security & Privacy** tab.
3. Locate the **Master Passphrase Management** section.
4. Enter your **Current Master Passphrase**.
5. Enter your **New Master Passphrase** (minimum 8 characters).
   - Review the password strength meter to verify high entropy.
6. Click **Rotate Master Passphrase & Re-encrypt**.
7. Confirm the prompt in the verification dialog.
8. Vaultora executes the rotation:
   - Generates a fresh 256-bit salt.
   - Derives a new key via 600,000 PBKDF2 iterations.
   - Generates a new HMAC authentication sentinel.
   - Re-seals your emergency recovery envelope with the new key material.
   - Re-encrypts all items and workspace structures.
9. A confirmation banner confirms: *"Master passphrase successfully rotated! All records re-encrypted with a fresh salt and new AES-256-GCM key."*

> [!NOTE]
> If passphrase rotation fails for any reason, Vaultora automatically aborts the operation and preserves your existing passphrase and ciphertext without data loss.

---

## 6. Emergency Recovery Phrase (24-Word Seed)

Vaultora's zero-knowledge recovery mechanism uses a 24-word phrase derived from the standard BIP-39 wordlist. This phrase can unseal the local `vaultora_recovery_envelope_v2` root key without knowing the master passphrase.

### Accessing & Storing Your 24 Words

1. Navigate to **Settings** → **Security & Privacy** → **Emergency Kit & Encrypted Backups**.
2. Click **24-Word Recovery Kit**.
3. The modal displays your 24 words in 4 columns of 6 words:

```
  1. velvet      7. hammer     13. liquid     19. marble
  2. galaxy      8. shield     14. harbor     20. puzzle
  3. forest      9. copper     15. beacon     21. silver
  4. shadow     10. tunnel     16. canyon     22. timber
  5. rocket     11. planet     17. oxygen     23. winter
  6. matrix     12. anchor     18. garden     24. yellow
```

4. Click **Copy 24-Word Phrase** or **Print Emergency Kit**.
5. Safe storage rules:
   - **Do:** Write it on paper and store in a locked drawer or fireproof safe.
   - **Do:** Keep multiple physical copies in distinct physical locations.
   - **Don't:** Save it in unencrypted cloud notes, Google Docs, email drafts, or messaging apps.
   - **Don't:** Take phone screenshots of the words.

### Rotating the Recovery Phrase

If you suspect your 24-word phrase was exposed or seen by an unauthorized party:

1. Open **Settings** → **Security & Privacy** → **24-Word Recovery Kit**.
2. Click **Rotate Recovery Phrase**.
3. Vaultora generates a new 24-word phrase and re-seals the recovery envelope with your active root key.
4. Your master passphrase and vault records remain completely unchanged.
5. Record and store the new 24-word phrase immediately.

### Recovering Access When Passphrase Is Forgotten

If you forget your master passphrase:

1. On the **Vaultora Locked** screen, click **"Recover via 24-Word Emergency Seed Phrase"** at the bottom.
2. Select the **This Device** tab.
3. Paste or type all 24 words separated by single spaces into the text box.
   - The field validates words in real time, displaying word count and dictionary status.
4. Click **Recover & Decrypt Local Vault**.
5. Once decrypted, Vaultora prompts you to **Set New Master Passphrase**.
6. Enter and confirm your new passphrase.
7. Click **Re-encrypt Vault & Continue**. Your vault is restored and secured under the new passphrase.

---

## 7. Encrypted Backups (.vaultora) & Restoration

Vaultora supports standalone, encrypted `.vaultora` backup archives for off-site disaster recovery and migration between devices.

### Exporting an Encrypted Backup

1. Navigate to **Settings** → **Security & Privacy** → **Emergency Kit & Encrypted Backups**.
2. Click **Export Encrypted Backup**.
3. Vaultora packages all items, workspaces, and preferences into a version 2 backup envelope:
   - Authenticated AES-256-GCM encryption.
   - Fresh 256-bit PBKDF2 salt with 600,000 iterations.
   - 96-bit initialization vector (IV) and 128-bit authentication tag.
   - Sealed with your 24-word recovery phrase (or custom backup password).
4. The file downloads as `vaultora-backup-YYYY-MM-DD.vaultora`.

### Restoring From a Backup File

1. Navigate to **Settings** → **Security & Privacy** (or click **Restore from Backup** on the lock screen).
2. Click **Restore from Backup**.
3. Click **Browse File** and select your `.vaultora` archive.
4. **Inspect Archive Header:** Vaultora reads the envelope metadata and displays:
   - Archive format version (e.g., `v2`).
   - Cipher suite (`AES-256-GCM`).
   - PBKDF2 iterations (`600,000`).
   - Export timestamp and record summary.
5. Enter the **Passphrase or 24-Word Phrase** used when creating the backup.
6. Select your **Restore Mode**:
   - **Merge (Recommended):** Adds restored records into your current vault without deleting existing items.
   - **Replace:** Completely replaces current vault records with the archive contents.
7. Click **Decrypt & Restore Vault**.
8. Vaultora authenticates the MAC tag, decrypts the payload, and imports the records.

---

## 8. Session Timeout, Auto-Lock & Clipboard Protection

### Auto-Lock Inactivity Timeout

To protect against physical shoulder-surfing or unattended device exposure, Vaultora monitors user activity (mouse movement, keyboard clicks, touch gestures).

1. Open **Settings** → **Security & Privacy** → **Session Timeout & Auto-Lock**.
2. Select an inactivity duration:
   - **5 Minutes:** High-security environments (shared offices, public spaces).
   - **15 Minutes (Default):** Balanced security and convenience.
   - **30 Minutes:** Extended focus sessions.
   - **60 Minutes:** Dedicated, secure workstations.
3. When the timeout expires:
   - The active `CryptoKey` reference in memory is invalidated.
   - In-memory decrypted records are emptied (`items = []`).
   - The clipboard auto-clear timer is flushed.
   - The UI returns to the **Vaultora Locked** screen.

### Manual Lock

To immediately lock your vault at any time:
- Click **Lock Vault** (rose button with lock icon) in the top-right corner of the navigation bar.
- Or click **Lock Vault Now** in **Settings** → **Security & Privacy**.

### 30-Second Clipboard Auto-Clear

When you click **Copy** on any password, note, card number, or credential:

1. Vaultora copies the value to your system clipboard.
2. A confirmation notification appears for 2.5 seconds.
3. Vaultora initiates a 30-second timer.
4. After 30 seconds, Vaultora overwrites the clipboard with an empty string (`""`) to prevent accidental pasting into web forms or messaging apps.
5. A sanitized audit event records that a copy operation took place (without ever logging the secret itself).

---

## 9. Troubleshooting Common Issues

### Issue 1: "Authentication failed: Incorrect master passphrase"

- **Check Caps Lock:** Passphrases are case-sensitive. Verify Caps Lock is off.
- **Check Extra Spaces:** Ensure no accidental leading or trailing spaces were pasted.
- **Use the Eye Icon:** Click the eye toggle to view the entered passphrase and verify spelling.
- **Rate Limiting Cooldown:** If multiple failed attempts occurred, wait for the lockout countdown timer to finish before typing again.
- **Resolution:** If forgotten, click **"Recover via 24-Word Emergency Seed Phrase"** on the lock screen.

### Issue 2: "Authentication failed: The entered 24-word recovery phrase could not decrypt this vault"

- **Check Word Count:** Verify exactly 24 words are entered.
- **Check Word Spelling:** Ensure all words are lowercase and exist in the standard BIP-39 wordlist.
- **Check Word Order:** The sequence must match positions 1 through 24 exactly as generated.
- **Different Vault:** Ensure you are not entering the recovery phrase from a different installation or previous reset.

### Issue 3: Browser preview shows stale cache or another application

- **Cause:** Browsers cache Progressive Web App (PWA) service workers aggressively.
- **Solution:** Perform a hard refresh:
  - Windows/Linux: `Ctrl + F5` or `Ctrl + Shift + R`
  - macOS: `Cmd + Shift + R`
  - Or open Developer Tools (`F12`) → **Application** tab → **Storage** → Click **"Clear site data"**.

### Issue 4: Android installation error "App not installed as package appears to be invalid"

- **Cause:** Installing an APK signed with a different key over an existing installation, or using an unaligned package.
- **Solution:**
  1. Verify you are using the verified release APK: `vaultora-production-v1.0.7.apk`.
  2. If an earlier development build was installed with a debug certificate, export your vault backup first, uninstall the old app, and install v1.0.7 cleanly.

### Issue 5: Backup restoration reports "Decryption failed: MAC tag rejected"

- **Cause:** The passphrase entered does not match the password or 24-word phrase that sealed that specific `.vaultora` file, or the file was corrupted in transit.
- **Solution:** Ensure you enter the exact secret used at the time of export. If using the 24-word phrase, ensure all 24 words are lowercase with single spaces between them.

---

## 10. Security Best Practices & Data-Loss Prevention

Following these principles guarantees that your credentials remain secure and recoverable:

1. **The Zero-Knowledge Rule:**
   - Vaultora has no master backdoors, no reset emails, and no recovery agents.
   - **If you lose both your master passphrase AND your 24-word recovery phrase, your encrypted data cannot be recovered by anyone.**
2. **The 3-2-1 Backup Strategy:**
   - **3 Copies:** Keep your live vault on your device, one encrypted `.vaultora` export on an external flash drive, and one printed paper Emergency Kit.
   - **2 Media Types:** One digital archive (`.vaultora`), one physical printout.
   - **1 Off-Site:** Store a paper Emergency Kit or backup USB drive in a separate physical location (e.g., bank safety deposit box or trusted family safe).
3. **Audit Credential Health Regularly:**
   - Open **Settings** → **Credential Health** once a month.
   - Address any credentials flagged as **Weak**, **Reused**, or **Missing MFA**.
   - Use the built-in password generator to rotate compromised credentials to 20+ character random strings.
4. **Use Workspaces for Client Separation:**
   - Never mix client credentials in your personal workspace.
   - When ending an engagement with a client or contractor, revoke collaborator access and rotate shared credentials immediately.
5. **Keep Device Security Intact:**
   - Set a strong device lock code or biometric lock on your mobile phone and workstation.
   - Keep your operating system and web browser updated with the latest security patches.
