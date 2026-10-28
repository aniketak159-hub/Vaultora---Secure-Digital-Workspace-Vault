#!/usr/bin/env python3
"""
Vaultora Production Android APK Builder & Official Multi-Scheme Signer
Version 1.0.7 (versionCode 7)

Generates a 100% compliant, installable, production-ready Android APK:
1. Native Android components (classes.dex, resources.arsc, res, AndroidManifest.xml)
2. Upgraded version: versionCode=7, versionName="1.0.7"
3. Preserves exact Android Application ID: io.vaultora.app
4. Bundles current, updated offline web distribution assets in assets/www/
5. Strict 4-byte zipalign on all uncompressed resources (resources.arsc, icons, PNGs)
6. Official Google apksigner multi-scheme signing (Scheme v1 JAR + Scheme v2 + Scheme v3)
7. Uses established release keystore (vaultora-release.keystore) ensuring update continuity
8. End-to-end verification with apksigner verify, zipalign -c, and aapt dump badging
"""

import os
import sys
import shutil
import hashlib
import struct
import subprocess
import tempfile
import zipfile

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DIST_DIR = os.path.join(WORKSPACE_DIR, 'dist')
PUBLIC_DOWNLOADS = os.path.join(WORKSPACE_DIR, 'public', 'downloads')
DIST_DOWNLOADS = os.path.join(DIST_DIR, 'downloads')
ANDROID_BIN = os.path.join(WORKSPACE_DIR, 'android-build', 'bin')
KEYSTORE = os.path.join(WORKSPACE_DIR, 'vaultora-release.keystore')
BASE_APK = os.path.join(WORKSPACE_DIR, 'android-build', 'base-platform.apk')

VERSION_NAME = "1.0.7"
VERSION_CODE = 7
OUTPUT_APK_NAME = f"vaultora-production-v{VERSION_NAME}.apk"
OUTPUT_APK = os.path.join(PUBLIC_DOWNLOADS, OUTPUT_APK_NAME)

def run(cmd, cwd=None):
    res = subprocess.run(cmd, cwd=cwd, shell=isinstance(cmd, str), capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Error executing: {cmd}")
        print("Stdout:", res.stdout)
        print("Stderr:", res.stderr)
        sys.exit(1)
    return res.stdout

def patch_manifest_binary(manifest_raw: bytes, version_name: str = VERSION_NAME, version_code: int = VERSION_CODE) -> bytes:
    """
    Patches the binary AndroidManifest.xml (AXML format):
    - Updates versionName string in string pool (UTF-16LE)
    - Updates versionCode uint32 value in root manifest attribute
    """
    manifest = bytearray(manifest_raw)
    
    # 1. Update versionName string in string pool
    for old_ver in ["1.0.0", "1.0.1", "1.0.2", "1.0.3", "1.0.4", "1.0.5", "1.0.6"]:
        old_utf16 = old_ver.encode('utf-16le')
        idx = manifest.find(old_utf16)
        if idx != -1:
            new_utf16 = version_name.encode('utf-16le')
            manifest[idx:idx+len(new_utf16)] = new_utf16
            break
            
    # 2. Update versionCode in <manifest> tag attributes
    # Offset 2068 is versionCode uint32 attribute value in baseline binary
    if len(manifest) >= 2072:
        ns, name, raw_val, size_type, old_code = struct.unpack('<IIIII', manifest[2052:2072])
        if name == 0:  # string index 0 is versionCode
            struct.pack_into('<I', manifest, 2068, version_code)
            
    return bytes(manifest)

def verify_apk_package(apk_path: str):
    """
    Comprehensive verification against Android OS runtime standards using official Google SDK tools:
    1. AXML manifest parsing: package name, versionCode, versionName via aapt
    2. 4-byte ZipAlign on all uncompressed resources via zipalign -c
    3. Official apksigner multi-scheme verification (v1, v2, v3)
    """
    print("\n--> [Verification] Running official Google Android SDK verification...")
    
    # 1. Check AXML Manifest via aapt
    badging = run(f"aapt dump badging '{apk_path}'")
    assert "package: name='io.vaultora.app'" in badging, "Package ID mismatch in badging"
    assert f"versionCode='{VERSION_CODE}'" in badging, f"versionCode {VERSION_CODE} not found in badging"
    assert f"versionName='{VERSION_NAME}'" in badging, f"versionName {VERSION_NAME} not found in badging"
    print(f"    [aapt OK] Package: io.vaultora.app, versionCode: {VERSION_CODE}, versionName: {VERSION_NAME}")

    # 2. Check ZipAlign
    run(f"zipalign -c 4 '{apk_path}'")
    print("    [zipalign OK] All uncompressed resources (resources.arsc, launcher icons, PNGs) strictly 4-byte aligned")

    # 3. Check official apksigner
    verify_output = run(f"apksigner verify --verbose --min-sdk-version 21 '{apk_path}'")
    assert "Verifies" in verify_output, f"apksigner verification failed: {verify_output}"
    assert "Verified using v1 scheme (JAR signing): true" in verify_output, "Scheme v1 not verified"
    assert "Verified using v2 scheme (APK Signature Scheme v2): true" in verify_output, "Scheme v2 not verified"
    assert "Verified using v3 scheme (APK Signature Scheme v3): true" in verify_output, "Scheme v3 not verified"
    print("    [apksigner OK] All signature schemes VERIFIED (v1 JAR + v2 AOSP Block + v3 Key Rotation)")

def main():
    print("=" * 70)
    print(f" Vaultora Production Android Release Builder (v{VERSION_NAME} - Code {VERSION_CODE})")
    print("=" * 70)

    # Step 1: Clean build the latest Vite distribution bundle
    print("--> Step 1: Compiling fresh web application bundle from source...")
    run("npm run build", cwd=WORKSPACE_DIR)

    # Step 2: Extract base Android platform binaries from baseline
    print("--> Step 2: Extracting and upgrading Android platform binaries...")
    if not os.path.exists(BASE_APK):
        raise FileNotFoundError(f"Baseline APK not found at {BASE_APK}")

    temp_dir = tempfile.mkdtemp()
    try:
        raw_unsigned_apk = os.path.join(temp_dir, 'unsigned.apk')
        aligned_apk = os.path.join(temp_dir, 'aligned.apk')

        # Read base platform resources
        with zipfile.ZipFile(BASE_APK, 'r') as z_base:
            manifest_raw = z_base.read('AndroidManifest.xml')
            dex_data = z_base.read('classes.dex')
            arsc_data = z_base.read('resources.arsc')
            icon_data = z_base.read('res/drawable-nodpi-v4/ic_launcher.png')

        manifest_patched = patch_manifest_binary(manifest_raw, version_name=VERSION_NAME, version_code=VERSION_CODE)

        # Assemble unsigned APK archive
        print("--> Step 3: Packing updated web application assets into assets/www/...")
        with zipfile.ZipFile(raw_unsigned_apk, 'w') as z_out:
            # Core platform files
            z_out.writestr('AndroidManifest.xml', manifest_patched, compress_type=zipfile.ZIP_DEFLATED)
            z_out.writestr('classes.dex', dex_data, compress_type=zipfile.ZIP_DEFLATED)
            # resources.arsc and launcher icon MUST be uncompressed for mmap
            z_out.writestr('resources.arsc', arsc_data, compress_type=zipfile.ZIP_STORED)
            z_out.writestr('res/drawable-nodpi-v4/ic_launcher.png', icon_data, compress_type=zipfile.ZIP_STORED)

            # Web application assets from dist/
            for root, dirs, files in os.walk(DIST_DIR):
                for f in files:
                    full_path = os.path.join(root, f)
                    rel_path = os.path.relpath(full_path, DIST_DIR)
                    if rel_path.startswith('downloads'):
                        continue
                    with open(full_path, 'rb') as fp:
                        data = fp.read()
                    # Store images uncompressed
                    is_img = rel_path.lower().endswith(('.png', '.ico', '.jpg', '.webp'))
                    ctype = zipfile.ZIP_STORED if is_img else zipfile.ZIP_DEFLATED
                    z_out.writestr(f"assets/www/{rel_path}".replace(os.sep, '/'), data, compress_type=ctype)

        # Step 4: 4-byte zipalign
        print("--> Step 4: Aligning archive with official zipalign (4-byte alignment)...")
        run(f"zipalign -f -p 4 '{raw_unsigned_apk}' '{aligned_apk}'")
        run(f"zipalign -c 4 '{aligned_apk}'")

        # Step 5: Multi-scheme sign with official apksigner
        print("--> Step 5: Multi-signing release APK via official apksigner (v1 + v2 + v3)...")
        signed_apk = os.path.join(temp_dir, OUTPUT_APK_NAME)
        run(
            f"apksigner sign --ks '{KEYSTORE}' --ks-key-alias vaultora_release "
            f"--ks-pass pass:vaultora2026 --key-pass pass:vaultora2026 "
            f"--min-sdk-version 24 "
            f"--v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true "
            f"--out '{signed_apk}' '{aligned_apk}'"
        )

        # Step 6: Verify package integrity
        verify_apk_package(signed_apk)

        # Step 7: Write to release locations
        os.makedirs(PUBLIC_DOWNLOADS, exist_ok=True)
        shutil.copy2(signed_apk, OUTPUT_APK)

        os.makedirs(DIST_DOWNLOADS, exist_ok=True)
        shutil.copy2(signed_apk, os.path.join(DIST_DOWNLOADS, OUTPUT_APK_NAME))

        os.makedirs(ANDROID_BIN, exist_ok=True)
        shutil.copy2(signed_apk, os.path.join(ANDROID_BIN, OUTPUT_APK_NAME))
        shutil.copy2(signed_apk, os.path.join(ANDROID_BIN, 'aligned.apk'))

        with open(OUTPUT_APK, 'rb') as f:
            apk_bytes = f.read()
        apk_sha256 = hashlib.sha256(apk_bytes).hexdigest()
        apk_size = len(apk_bytes)

        print("\n" + "=" * 70)
        print(f" SUCCESS: Production Android Release APK v{VERSION_NAME} Ready!")
        print(f" File:       {OUTPUT_APK}")
        print(f" Size:       {apk_size:,} bytes ({apk_size / 1024:.1f} KB / {apk_size / (1024*1024):.2f} MB)")
        print(f" SHA-256:    {apk_sha256}")
        print(f" Package:    io.vaultora.app (versionCode={VERSION_CODE}, versionName={VERSION_NAME})")
        print(f" Signatures: Scheme v1 (JAR) + Scheme v2 (AOSP APK Signing Block) + Scheme v3")
        print(f" Download:   /downloads/{OUTPUT_APK_NAME}")
        print("=" * 70)

        return apk_sha256

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == '__main__':
    main()
