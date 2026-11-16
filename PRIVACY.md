# Privacy Policy — Vaultora

**Effective Date:** 2026-11-06  
**Version:** 1.0  
**Product:** Vaultora — Secure Digital Workspace & Vault  
**Package Identifier:** `io.vaultora.app`  
**Contact:** privacy@vaultora.io

---

## 1. Summary

Vaultora is a **zero-knowledge, client-side encrypted password manager and digital vault**. We designed it so that **we never see, store, or have access to your master passphrase, encryption keys, recovery phrases, or decrypted vault data**. All cryptographic operations occur locally on your device.

This policy explains what information Vaultora processes, how it is protected, and your rights.

---

## 2. Information We Do Not Collect

Vaultora does **not** collect, transmit, or store on any server:

- Your master passphrase
- Your 24-word emergency recovery phrase
- Your encryption keys (master key, vault root key, recovery key)
- Your decrypted vault records (passwords, notes, credentials, workspaces)
- Your clipboard contents
- Your browsing history or usage analytics
- Personally identifiable information (PII)

There are no analytics, telemetry, crash reporting, or tracking libraries in the application code.

---

## 3. Information Stored Locally on Your Device

All vault data remains exclusively on your device(s). The following is stored in **encrypted form only**:

| Data Type | Storage Location | Encryption |
|-----------|------------------|------------|
| Vault records (logins, notes, cards, etc.) | IndexedDB (`vaultora_secure_db_v2`) / localStorage fallback | AES-256-GCM |
| Master key derivation salt | IndexedDB / localStorage | Not secret (public parameter) |
| Authentication sentinel | IndexedDB / localStorage | AES-256-GCM |
| Recovery envelope (`vaultora_recovery_envelope_v2`) | IndexedDB / localStorage | AES-256-GCM |
| Encrypted backup exports (`.vaultora`) | User-chosen location (downloads, external drive) | AES-256-GCM |
| Non-sensitive preferences (theme, auto-lock timeout) | IndexedDB / localStorage | Plaintext (non-sensitive) |

**Plaintext secrets are never written to persistent storage.**

---

## 4. Cryptographic Protections

| Component | Standard | Parameters |
|-----------|----------|------------|
| Symmetric Encryption | AES-256-GCM (NIST SP 800-38D) | 256-bit key, 96-bit unique IV per record, 128-bit auth tag |
| Key Derivation | PBKDF2-HMAC-SHA-256 (RFC 8018) | 600,000 iterations, 256-bit CSPRNG salt |
| Recovery Phrase | BIP-39 English Wordlist | 24 words (256-bit entropy) |
| Recovery Envelope | AES-256-GCM sealed envelope | Format: `vaultora_recovery_envelope_v2` |
| Randomness | `crypto.getRandomValues()` | CSPRNG |

Keys are derived in volatile memory with `extractable: false` (Web Crypto API) and purged on vault lock or session timeout.

---

## 5. Network Communications

Vaultora operates **100% offline** for all core password management functions. The only network requests are:

1. **Google Fonts** — Font loading on web browsers (when online). You can block this via browser settings or use the installed PWA/Android app.
2. **APK Self-Hosted Verification** — Optional download page integrity check on web deployments.

No vault data, keys, or credentials are transmitted in any network request.

---

## 6. Android-Specific Protections

The Android application (`io.vaultora.app`) includes:

- `android:allowBackup="false"` — Prevents Google Cloud Backup and ADB backup extraction of vault databases.
- `FLAG_SECURE` — Blocks screenshots, screen recordings, and task-switcher thumbnail previews.
- Hardened WebView — File access disabled, mixed content blocked, virtual asset domain isolation (`https://appassets.androidplatform.net`).
- Android KeyStore Bridge — Hardware-backed AES-256-GCM key generation (TEE/StrongBox where available).

---

## 7. Optional AI Assistant Feature

Vaultora includes an optional AI workspace assistant drawer powered by Google Gemini.

- **This feature is opt-in.** It is disabled by default and requires you to provide a `GEMINI_API_KEY`.
- When enabled, **only your prompts to the assistant** are sent to Google's Gemini API. Your vault data, passphrases, and recovery phrases are **never** sent to the AI.
- Review Google's [Gemini API Data Usage Policy](https://ai.google.dev/gemini-api/terms) before enabling.

---

## 8. Data Retention & Deletion

- **Local Data:** Persists until you explicitly delete it via:
  - "Reset Vault" in Settings (requires passphrase confirmation)
  - Uninstalling the Android app (removes all app data)
  - Clearing browser site data (web/PWA)
- **Backups:** `.vaultora` files persist until you delete them from your chosen storage location.
- **No Server Retention:** We have no servers storing your data; there is nothing for us to delete on your behalf.

---

## 9. Your Rights (GDPR / CCPA / General)

Since we do not process your personal data on our infrastructure:

- **Right of Access:** Your data is fully accessible to you within the app.
- **Right to Rectification:** You can edit any vault record at any time.
- **Right to Erasure:** Delete records individually or reset the entire vault.
- **Right to Portability:** Export encrypted `.vaultora` archives for migration.
- **Right to Object / Restrict:** Not applicable — no processing occurs on our systems.
- **Data Protection Officer:** Not required (no server-side processing).

---

## 10. Children's Privacy

Vaultora is not directed at children under 13 (or 16 in the EU). We do not knowingly collect data from children. If a parent discovers a child using Vaultora, they can simply uninstall the app or clear browser data to remove all local vault data.

---

## 11. Security Incident Notification

Vaultora has no centralized user database or server-side vault storage. A "breach" of our infrastructure would not expose your vault data. However, if a vulnerability is discovered in the client application:

- We will publish a security advisory via [GitHub Security Advisories](https://github.com/aniketak159-hub/Vaultora---Secure-Digital-Workspace-Vault/security/advisories).
- We will release a patched version promptly.
- You are responsible for updating the application.

---

## 12. Third-Party Links

The web application may load fonts from `fonts.googleapis.com` and `fonts.gstatic.com`. These requests are governed by [Google's Privacy Policy](https://policies.google.com/privacy). No user data is sent to Google beyond standard font request headers.

---

## 13. Changes to This Policy

We may update this policy to reflect changes in the application or legal requirements. The "Effective Date" at the top will be updated. Continued use of Vaultora after changes constitutes acceptance.

---

## 14. Contact

For privacy questions, data requests, or security concerns:

- **Email:** privacy@vaultora.io
- **Security Issues:** GitHub Private Security Advisories or security@vaultora.io
- **Repository:** https://github.com/aniketak159-hub/Vaultora---Secure-Digital-Workspace-Vault

---

*This policy is part of the Vaultora documentation suite. See also: [Security and Encryption Specification](docs/Security-and-Encryption.md), [User Guide](docs/User-Guide.md), [Terms of Service](TERMS.md).*