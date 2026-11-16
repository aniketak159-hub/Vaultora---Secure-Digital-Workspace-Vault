#!/usr/bin/env bash
set -e

echo "=== Vaultora Production Android APK Builder ==="

WORKSPACE_DIR="$(pwd)"
BUILD_DIR="$WORKSPACE_DIR/android-build"
PUBLIC_DOWNLOADS="$WORKSPACE_DIR/public/downloads"
DIST_DOWNLOADS="$WORKSPACE_DIR/dist/downloads"
ANDROID_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"

mkdir -p "$PUBLIC_DOWNLOADS"
mkdir -p "$BUILD_DIR/src/io/vaultora/app"
mkdir -p "$BUILD_DIR/res/values"
mkdir -p "$BUILD_DIR/res/drawable-nodpi"
mkdir -p "$BUILD_DIR/assets"
mkdir -p "$BUILD_DIR/obj"
mkdir -p "$BUILD_DIR/bin"

# 1. Build Web Application Asset Bundle
echo "--> Compiling Web Asset Bundle (Vite)..."
npm run build

echo "--> Copying web bundle to Android assets..."
rm -rf "$BUILD_DIR/assets/www"
cp -r "$WORKSPACE_DIR/dist" "$BUILD_DIR/assets/www"
rm -rf "$BUILD_DIR/assets/www/downloads"

# 2. Setup Android Manifest
cat << 'EOF' > "$BUILD_DIR/AndroidManifest.xml"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="io.vaultora.app"
    android:versionCode="2"
    android:versionName="1.0.1">

    <uses-sdk android:minSdkVersion="24" android:targetSdkVersion="34" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    <uses-permission android:name="android.permission.USE_FINGERPRINT" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:label="@string/app_name"
        android:icon="@drawable/ic_launcher"
        android:allowBackup="false"
        android:hardwareAccelerated="true"
        android:supportsRtl="true"
        android:usesCleartextTraffic="true"
        android:theme="@android:style/Theme.DeviceDefault.NoActionBar">

        <activity
            android:name="io.vaultora.app.MainActivity"
            android:label="@string/app_name"
            android:configChanges="orientation|keyboardHidden|screenSize"
            android:exported="true"
            android:windowSoftInputMode="adjustResize"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="vaultora" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# 3. Setup Android Strings & Colors
cat << 'EOF' > "$BUILD_DIR/res/values/strings.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Vaultora</string>
</resources>
EOF

# 4. Copy launcher icon
cp "$WORKSPACE_DIR/public/pwa-192x192.png" "$BUILD_DIR/res/drawable-nodpi/ic_launcher.png"

# 5. Copy Android Native Java Activity with AndroidKeyStore Hardware Bridge
echo "--> Using hardened Android native activity (KeyStore hardware bridge & FLAG_SECURE)..."
cp "$WORKSPACE_DIR/android/app/src/main/java/io/vaultora/app/MainActivity.java" "$BUILD_DIR/src/io/vaultora/app/MainActivity.java"


# 6. Generate R.java with aapt
echo "--> Compiling Android resources with aapt..."
aapt package -f -m \
    -J "$BUILD_DIR/src" \
    -M "$BUILD_DIR/AndroidManifest.xml" \
    -S "$BUILD_DIR/res" \
    -I "$ANDROID_JAR"

# 7. Compile Java to classfiles
echo "--> Compiling Java sources with javac..."
javac -source 1.8 -target 1.8 \
    -cp "$ANDROID_JAR" \
    -d "$BUILD_DIR/obj" \
    $(find "$BUILD_DIR/src" -name "*.java")

# 8. Convert classfiles to Dalvik Executable (classes.dex)
echo "--> Generating classes.dex with dalvik-exchange..."
dalvik-exchange --dex --output="$BUILD_DIR/bin/classes.dex" "$BUILD_DIR/obj"

# 9. Package base unaligned APK
echo "--> Packaging unaligned APK with aapt..."
aapt package -f \
    -M "$BUILD_DIR/AndroidManifest.xml" \
    -S "$BUILD_DIR/res" \
    -A "$BUILD_DIR/assets" \
    -I "$ANDROID_JAR" \
    -F "$BUILD_DIR/bin/unaligned.apk"

# 10. Add classes.dex into APK
echo "--> Adding classes.dex to APK..."
cd "$BUILD_DIR/bin"
zip -uj unaligned.apk classes.dex
cd "$WORKSPACE_DIR"

# 11. Align APK (4-byte boundary)
echo "--> Running zipalign..."
zipalign -f -p 4 "$BUILD_DIR/bin/unaligned.apk" "$BUILD_DIR/bin/aligned.apk"

# 12. Create Production Keystore if not present
KEYSTORE="$WORKSPACE_DIR/vaultora-release.keystore"
if [ ! -f "$KEYSTORE" ]; then
    echo "--> Generating production cryptographic keystore..."
    keytool -genkey -v \
        -keystore "$KEYSTORE" \
        -alias vaultora_release \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -storepass vaultora2026 \
        -keypass vaultora2026 \
        -dname "CN=Vaultora Security, OU=Mobile Engineering, O=Vaultora Inc, L=San Francisco, ST=California, C=US"
fi

# 13. Sign the APK with apksigner (v1, v2, v3 schemes)
FINAL_APK="$PUBLIC_DOWNLOADS/vaultora-production-v1.0.1.apk"
echo "--> Signing production APK with apksigner..."
apksigner sign \
    --ks "$KEYSTORE" \
    --ks-pass pass:vaultora2026 \
    --key-pass pass:vaultora2026 \
    --ks-key-alias vaultora_release \
    --out "$FINAL_APK" \
    "$BUILD_DIR/bin/aligned.apk"

# Also copy to dist if dist exists
mkdir -p "$DIST_DOWNLOADS"
cp "$FINAL_APK" "$DIST_DOWNLOADS/vaultora-production-v1.0.1.apk"

# 14. Verification
echo "--> Verifying production APK signature..."
apksigner verify --verbose "$FINAL_APK"

FILE_SIZE=$(du -h "$FINAL_APK" | cut -f1)
SHA256=$(sha256sum "$FINAL_APK" | cut -d' ' -f1)

echo "=========================================================="
echo "SUCCESS: Production Android APK generated successfully!"
echo "File: $FINAL_APK"
echo "Size: $FILE_SIZE"
echo "SHA-256: $SHA256"
echo "Package ID: io.vaultora.app"
echo "=========================================================="
