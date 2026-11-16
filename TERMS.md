# Terms of Service — Vaultora

**Effective Date:** 2026-11-06  
**Version:** 1.0  
**Product:** Vaultora — Secure Digital Workspace & Vault  
**Package Identifier:** `io.vaultora.app`  
**Contact:** legal@vaultora.io

---

## 1. Acceptance of Terms

By downloading, installing, accessing, or using Vaultora ("the Application"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Application.

---

## 2. Description of Service

Vaultora is a **zero-knowledge, client-side encrypted password manager and digital vault**. It enables you to securely store, organize, and retrieve credentials, notes, and sensitive records using authenticated encryption (AES-256-GCM) with keys derived from your master passphrase via PBKDF2-HMAC-SHA-256 (600,000 iterations).

**Key Characteristics:**
- All encryption/decryption occurs locally on your device.
- We (the developers) have **zero access** to your master passphrase, recovery phrase, encryption keys, or decrypted data.
- The Application functions fully offline.
- No cloud synchronization, account system, or centralized data storage is provided.

---

## 3. License Grant

Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to:

- Download, install, and use the Application on devices you own or control.
- Use the Application for personal or commercial password management purposes.

**Restrictions:** You may not:
- Reverse engineer, decompile, or disassemble the Application (except where permitted by law).
- Remove or alter any copyright, trademark, or proprietary notices.
- Redistribute, sublicense, or sell the Application without authorization.
- Use the Application for any illegal or unauthorized purpose.

---

## 4. Your Responsibilities

### 4.1 Master Passphrase & Recovery Phrase

**You are solely responsible for:**
- Creating a strong, memorable master passphrase.
- Securely recording and storing your **24-word emergency recovery phrase** generated during vault initialization.
- Never sharing your master passphrase or recovery phrase with anyone.

**Critical Warning:** If you lose **both** your master passphrase **and** your 24-word recovery phrase, **your vault data cannot be recovered by anyone**, including the Vaultora developers. There are no backdoors, master keys, or password reset mechanisms.

### 4.2 Backups

You are strongly encouraged to:
- Regularly export encrypted `.vaultora` backup archives.
- Store backups on separate physical media (external drive, USB) in a secure location.
- Maintain a physical copy of your 24-word recovery phrase in a fireproof safe or safety deposit box.

### 4.3 Device Security

You should:
- Use a strong device lock (PIN, biometric) on all devices running Vaultora.
- Keep your operating system and browser updated.
- Avoid installing untrusted browser extensions that could access vault data while unlocked.

---

## 5. No Warranty

**THE APPLICATION IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:**

- MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE
- NON-INFRINGEMENT
- ACCURACY, RELIABILITY, OR CORRECTNESS OF DATA
- UNINTERRUPTED OR ERROR-FREE OPERATION
- COMPATIBILITY WITH ANY SPECIFIC HARDWARE, OS, OR BROWSER VERSION

**WE DO NOT WARRANT THAT:**
- The Application will meet your requirements.
- Your vault data will never be lost or corrupted (though we implement extensive safeguards).
- The Application is free from vulnerabilities (we welcome responsible disclosure).
- Encrypted backups will be restorable on all future versions (format migrations are documented and tested).

---

## 6. Limitation of Liability

**TO THE MAXIMUM EXTENT PERMITTED BY LAW:**

- **IN NO EVENT SHALL THE DEVELOPERS, CONTRIBUTORS, OR DISTRIBUTORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES**, INCLUDING LOSS OF DATA, LOSS OF PROFITS, BUSINESS INTERRUPTION, OR COST OF SUBSTITUTE SERVICES, ARISING FROM OR RELATED TO YOUR USE OR INABILITY TO USE THE APPLICATION.
- **OUR TOTAL AGGREGATE LIABILITY FOR ANY CLAIMS ARISING FROM THESE TERMS SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE APPLICATION (WHICH IS $0 FOR THE CORE APPLICATION).**

**THIS LIMITATION APPLIES REGARDLESS OF THE LEGAL THEORY (CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, OR OTHERWISE) AND EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.**

---

## 7. Indemnification

You agree to indemnify, defend, and hold harmless the Vaultora developers, contributors, and distributors from and against any claims, damages, losses, liabilities, and expenses (including reasonable attorneys' fees) arising from:
- Your use of the Application in violation of these Terms.
- Your violation of any applicable law or regulation.
- Your failure to secure your master passphrase, recovery phrase, or device.

---

## 8. Intellectual Property

- **Application Code:** Licensed under the [MIT License](LICENSE) unless otherwise noted.
- **Trademarks:** "Vaultora", the Vaultora logo, and related branding are trademarks of the Vaultora project. You may not use them in a way that implies endorsement or affiliation without permission.
- **Documentation:** [Security and Encryption Specification](docs/Security-and-Encryption.md), [User Guide](docs/User-Guide.md), and [Developer Documentation](docs/Developer-Documentation.md) are licensed under CC-BY-4.0.

---

## 9. Third-Party Components

The Application includes third-party open-source libraries. Their licenses are preserved in the source tree and/or the `LICENSE` file. Key dependencies include:
- React, TypeScript, Vite, Tailwind CSS (MIT/Apache-2.0)
- Web Crypto API (browser standard)
- Android SDK components (Apache-2.0)

The optional AI assistant feature uses Google's Gemini API, subject to [Google's Terms of Service](https://ai.google.dev/gemini-api/terms).

---

## 10. Android Application Specific Terms

If you install the Android APK (`io.vaultora.app`):
- You acknowledge the APK is self-signed by the Vaultora project (not distributed via Google Play Store at this time).
- You accept the risks of sideloading applications.
- The APK includes `FLAG_SECURE` and `allowBackup="false"` for your protection.
- Updates must be manually installed; no automatic update mechanism exists.

---

## 11. Export Controls

You agree not to use, export, or re-export the Application in violation of any applicable export control laws, including U.S. Export Administration Regulations. Cryptographic functionality may be subject to export restrictions in certain jurisdictions.

---

## 12. Governing Law & Dispute Resolution

These Terms shall be governed by the laws of the jurisdiction where the primary developer resides, without regard to conflict of law principles. Disputes shall be resolved through binding arbitration or in courts of competent jurisdiction in that location.

---

## 13. Changes to Terms

We may modify these Terms at any time. The "Effective Date" will be updated. Continued use after changes constitutes acceptance. Material changes will be noted in release notes or the repository changelog.

---

## 14. Severability

If any provision is found unenforceable, the remaining provisions continue in full force and effect.

---

## 15. Contact

For legal inquiries:
- **Email:** legal@vaultora.io
- **Repository:** https://github.com/aniketak159-hub/Vaultora---Secure-Digital-Workspace-Vault
- **Security Issues:** GitHub Private Security Advisories or security@vaultora.io

---

*These Terms are part of the Vaultora documentation suite. See also: [Privacy Policy](PRIVACY.md), [Security and Encryption Specification](docs/Security-and-Encryption.md), [License](LICENSE).*