#!/usr/bin/env python3
"""
Production Android APK Builder for Vaultora using Official Android SDK Tools
(aapt, zipalign, jarsigner, apksigner)

Ensures 100% compliance with Android OS PackageParser & PackageInstaller:
- Valid binary AndroidManifest.xml (package="io.vaultora.app", versionCode=4, versionName="1.0.3")
- Compiled classes.dex & uncompressed resources.arsc (4-byte aligned)
- Bundled complete offline web application assets in assets/www/
- Official v1 JAR signing via jarsigner (SHA-256 with RSA)
- Official 4-byte zipalign
- Official v2 & v3 APK Signature Schemes via apksigner
- Validated via apksigner verify and aapt dump badging
"""

import os
import sys
import shutil
import zipfile
import subprocess
import hashlib
import struct

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DIST_DIR = os.path.join(WORKSPACE_DIR, 'dist')
PUBLIC_DOWNLOADS = os.path.join(WORKSPACE_DIR, 'public', 'downloads')
DIST_DOWNLOADS = os.path.join(DIST_DIR, 'downloads')
BASE_APK = os.path.join(WORKSPACE_DIR, 'android-build', 'base-platform.apk')
KEYSTORE = os.path.join(WORKSPACE_DIR, 'vaultora-release.keystore')
TEMP_BUILD_DIR = os.path.join(WORKSPACE_DIR, 'build_apk_temp')

# Release configuration (Release Code 7, Version 1.0.7)
VERSION_NAME = "1.0.7"
VERSION_CODE = 7
PRIMARY_APK_NAME = "vaultora-production-v1.0.7.apk"
SECONDARY_APK_NAME = "vaultora-production-v1.0.7.apk"

def run_cmd(cmd, cwd=None):
    res = subprocess.run(cmd, cwd=cwd, shell=isinstance(cmd, str), capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Error executing command: {cmd}")
        print("STDOUT:", res.stdout)
        print("STDERR:", res.stderr)
        raise RuntimeError(f"Command failed with code {res.returncode}")
    return res.stdout

def patch_manifest_binary(manifest_raw: bytes, version_name: str, version_code: int) -> bytes:
    manifest_ba = bytearray(manifest_raw)
    
    # 1. Update versionName string in UTF-16LE in string pool
    for old_v in ["1.0.0", "1.0.1", "1.0.2", "1.0.3", "1.0.4", "1.0.5"]:
        old_utf16 = old_v.encode('utf-16le')
        idx = manifest_ba.find(old_utf16)
        if idx != -1:
            new_utf16 = version_name.encode('utf-16le')
            manifest_ba[idx:idx + len(new_utf16)] = new_utf16
            break

    # 2. Update versionCode uint32 at offset 2068 in baseline manifest
    if len(manifest_ba) >= 2072:
        struct.pack_into('<I', manifest_ba, 2068, version_code)

    return bytes(manifest_ba)

def main():
    print("=" * 68)
    print(f" Vaultora Production Android Release Builder")
    print(f" Target Package: io.vaultora.app | Version: {VERSION_NAME} | Code: {VERSION_CODE}")
    print(f" Primary Output: {PRIMARY_APK_NAME}")
    print("=" * 68)

    os.makedirs(TEMP_BUILD_DIR, exist_ok=True)
    os.makedirs(PUBLIC_DOWNLOADS, exist_ok=True)

    # 1. Build Vite frontend bundle
    print("\n--> [1/6] Building production web application with Vite...")
    run_cmd("npm run build", cwd=WORKSPACE_DIR)

    # 2. Extract baseline Android platform binaries
    print("--> [2/6] Extracting Android platform binaries from baseline APK...")
    if not os.path.exists(BASE_APK):
        raise FileNotFoundError(f"Baseline APK not found at {BASE_APK}")

    with zipfile.ZipFile(BASE_APK, 'r') as z:
        manifest_raw = z.read('AndroidManifest.xml')
        dex_data = z.read('classes.dex')
        arsc_data = z.read('resources.arsc')
        icon_data = z.read('res/drawable-nodpi-v4/ic_launcher.png')

    manifest_patched = patch_manifest_binary(manifest_raw, VERSION_NAME, VERSION_CODE)

    # 3. Assemble unsigned APK archive
    print("--> [3/6] Assembling unsigned APK with latest offline web assets...")
    raw_unsigned_apk = os.path.join(TEMP_BUILD_DIR, 'vaultora_unsigned.apk')
    
    with zipfile.ZipFile(raw_unsigned_apk, 'w') as zout:
        # Android core binaries
        zout.writestr('AndroidManifest.xml', manifest_patched, compress_type=zipfile.ZIP_DEFLATED)
        zout.writestr('classes.dex', dex_data, compress_type=zipfile.ZIP_DEFLATED)
        # resources.arsc MUST be stored uncompressed for Android runtime mmap
        zout.writestr('resources.arsc', arsc_data, compress_type=zipfile.ZIP_STORED)
        # Launcher icon uncompressed
        zout.writestr('res/drawable-nodpi-v4/ic_launcher.png', icon_data, compress_type=zipfile.ZIP_STORED)

        # Pack web application assets into assets/www/
        for root, dirs, files in os.walk(DIST_DIR):
            for f in files:
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, DIST_DIR)
                if rel_path.startswith('downloads'):
                    continue
                with open(full_path, 'rb') as fp:
                    f_data = fp.read()
                # Store images uncompressed for instant zero-decompression rendering
                is_img = rel_path.lower().endswith(('.png', '.ico', '.jpg', '.webp'))
                ctype = zipfile.ZIP_STORED if is_img else zipfile.ZIP_DEFLATED
                zout.writestr(f"assets/www/{rel_path}", f_data, compress_type=ctype)

    print(f"    Raw APK assembled: {os.path.getsize(raw_unsigned_apk):,} bytes")

    # 4. Sign with jarsigner (Scheme v1 JAR signature)
    print("--> [4/6] Applying official Scheme v1 JAR signature via jarsigner...")
    jarsigned_apk = os.path.join(TEMP_BUILD_DIR, 'vaultora_jarsigned.apk')
    shutil.copy2(raw_unsigned_apk, jarsigned_apk)
    
    run_cmd(
        f"jarsigner -keystore '{KEYSTORE}' -storepass vaultora2026 -keypass vaultora2026 "
        f"-sigalg SHA256withRSA -digestalg SHA-256 '{jarsigned_apk}' vaultora_release"
    )

    # 5. 4-byte zipalign
    print("--> [5/6] Aligning archive with official zipalign (4-byte alignment)...")
    aligned_apk = os.path.join(TEMP_BUILD_DIR, 'vaultora_aligned.apk')
    if os.path.exists(aligned_apk):
        os.remove(aligned_apk)
    run_cmd(f"zipalign -f -p 4 '{jarsigned_apk}' '{aligned_apk}'")

    # Verify zipalign before signing v2/v3
    run_cmd(f"zipalign -c 4 '{aligned_apk}'")
    print("    zipalign check: PASSED (all uncompressed entries 4-byte aligned)")

    # 6. Sign with official Google apksigner (v1, v2, and v3)
    print("--> [6/6] Multi-signing with official apksigner (v1 + v2 + v3 schemes)...")
    final_output_apk = os.path.join(PUBLIC_DOWNLOADS, PRIMARY_APK_NAME)
    if os.path.exists(final_output_apk):
        os.remove(final_output_apk)

    run_cmd(
        f"apksigner sign --ks '{KEYSTORE}' --ks-key-alias vaultora_release "
        f"--ks-pass pass:vaultora2026 --key-pass pass:vaultora2026 "
        f"--min-sdk-version 24 "
        f"--v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true "
        f"--out '{final_output_apk}' '{aligned_apk}'"
    )

    # 7. Mirror to dist/downloads and android-build
    os.makedirs(DIST_DOWNLOADS, exist_ok=True)
    shutil.copy2(final_output_apk, os.path.join(DIST_DOWNLOADS, PRIMARY_APK_NAME))

    os.makedirs(os.path.join(WORKSPACE_DIR, 'android-build', 'bin'), exist_ok=True)
    shutil.copy2(final_output_apk, os.path.join(WORKSPACE_DIR, 'android-build', 'bin', PRIMARY_APK_NAME))

    # Also mirror to secondary name if defined
    if SECONDARY_APK_NAME:
        secondary_public = os.path.join(PUBLIC_DOWNLOADS, SECONDARY_APK_NAME)
        secondary_dist = os.path.join(DIST_DOWNLOADS, SECONDARY_APK_NAME)
        shutil.copy2(final_output_apk, secondary_public)
        shutil.copy2(final_output_apk, secondary_dist)

    # 8. Comprehensive Validation
    print("\n" + "=" * 68)
    print(" COMPREHENSIVE ANDROID RELEASE VERIFICATION")
    print("=" * 68)

    # apksigner verification
    verify_output = run_cmd(f"apksigner verify --verbose --min-sdk-version 21 '{final_output_apk}'")
    print("1. apksigner Verification:")
    for line in verify_output.strip().splitlines():
        print(f"   {line}")

    # zipalign verification
    align_output = run_cmd(f"zipalign -c -v 4 '{final_output_apk}'")
    last_align_line = align_output.strip().splitlines()[-1]
    print(f"2. zipalign Status: {last_align_line}")

    # aapt dump badging verification
    badging_output = run_cmd(f"aapt dump badging '{final_output_apk}'")
    print("3. Android Package Metadata:")
    for b_line in badging_output.strip().splitlines():
        if b_line.startswith(('package:', 'sdkVersion:', 'targetSdkVersion:', 'application-label:', 'launchable-activity:')):
            print(f"   {b_line}")

    apk_size = os.path.getsize(final_output_apk)
    with open(final_output_apk, 'rb') as fp:
        apk_sha = hashlib.sha256(fp.read()).hexdigest()

    print("\n" + "=" * 68)
    print(" SUCCESS: Production Android Release APK Built & Validated Successfully!")
    print(f" File:       {final_output_apk}")
    print(f" Size:       {apk_size:,} bytes ({apk_size / 1024:.1f} KB / {apk_size / (1024*1024):.2f} MB)")
    print(f" SHA-256:    {apk_sha}")
    print(f" Package ID: io.vaultora.app")
    print(f" Version:    {VERSION_NAME} (versionCode={VERSION_CODE})")
    print(f" Download:   /downloads/{PRIMARY_APK_NAME}")
    print("=" * 68)

    # Clean up temp
    shutil.rmtree(TEMP_BUILD_DIR, ignore_errors=True)
    return apk_sha

if __name__ == '__main__':
    main()
