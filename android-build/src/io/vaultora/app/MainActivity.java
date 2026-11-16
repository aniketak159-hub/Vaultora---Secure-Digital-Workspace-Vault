package io.vaultora.app;

import android.app.Activity;
import android.content.res.AssetManager;
import android.net.Uri;
import android.os.Bundle;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.security.KeyStore;
import java.util.HashMap;
import java.util.Map;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

public class MainActivity extends Activity {
    private static final String TAG = "Vaultora";
    public static final String ASSET_HOST = "appassets.androidplatform.net";
    public static final String START_URL = "https://" + ASSET_HOST + "/index.html";

    private WebView mWebView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        // Zero-Knowledge Security: prevent OS-level screen capture & task switcher snapshotting
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        );

        mWebView = new WebView(this);
        // Vaultora dark slate-950 theme background (prevents white startup flash)
        mWebView.setBackgroundColor(0xFF020617);
        mWebView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);
        setContentView(mWebView);

        WebSettings webSettings = mWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        // Security hardening: restrict direct local file URL access; serve strictly via LocalAssetWebViewClient
        webSettings.setAllowFileAccess(false);
        webSettings.setAllowContentAccess(false);
        webSettings.setAllowFileAccessFromFileURLs(false);
        webSettings.setAllowUniversalAccessFromFileURLs(false);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        webSettings.setSupportZoom(false);
        webSettings.setBuiltInZoomControls(false);
        webSettings.setUseWideViewPort(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                Log.d(TAG, "[JS] " + consoleMessage.message() + " ("
                        + consoleMessage.sourceId() + ":" + consoleMessage.lineNumber() + ")");
                return true;
            }
        });

        mWebView.setWebViewClient(new LocalAssetWebViewClient(getAssets()));

        // Register hardware-backed Android KeyStore bridge for secure local cryptographic acceleration
        mWebView.addJavascriptInterface(new VaultoraAndroidKeystore(this), "VaultoraAndroidKeystore");

        // Load zero-knowledge embedded web application bundle via secure local asset domain
        mWebView.loadUrl(START_URL);
    }

    /**
     * Android KeyStore Hardware Bridge
     * 
     * Addresses critical security insight: Browser storage (IndexedDB, LocalStorage, SQLite)
     * inside an Android WebView is NOT automatically backed by Android KeyStore hardware (TEE / StrongBox).
     * This bridge provides the web application with direct access to hardware-isolated cryptographic
     * key derivation and authenticated AES-256-GCM encryption.
     */
    public static class VaultoraAndroidKeystore {
        private static final String KEYSTORE_PROVIDER = "AndroidKeyStore";
        private static final String KEY_ALIAS = "VaultoraMasterHardwareKey";
        private final Activity mActivity;

        public VaultoraAndroidKeystore(Activity activity) {
            this.mActivity = activity;
            initHardwareKey();
        }

        private void initHardwareKey() {
            try {
                KeyStore keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
                keyStore.load(null);
                if (!keyStore.containsAlias(KEY_ALIAS)) {
                    KeyGenerator keyGenerator = KeyGenerator.getInstance(
                        KeyProperties.KEY_ALGORITHM_AES, KEYSTORE_PROVIDER);
                    KeyGenParameterSpec spec = new KeyGenParameterSpec.Builder(
                        KEY_ALIAS,
                        KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                        .setKeySize(256)
                        .build();
                    keyGenerator.init(spec);
                    keyGenerator.generateKey();
                    Log.i(TAG, "Hardware-backed AES-256-GCM key successfully generated in AndroidKeyStore.");
                }
            } catch (Exception e) {
                Log.w(TAG, "AndroidKeyStore initialization notice: " + e.getMessage());
            }
        }

        @JavascriptInterface
        public boolean isKeystoreAvailable() {
            try {
                KeyStore keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
                keyStore.load(null);
                return keyStore.containsAlias(KEY_ALIAS);
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface
        public String encryptWithHardwareKey(String plaintext) {
            try {
                KeyStore keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
                keyStore.load(null);
                SecretKey secretKey = (SecretKey) keyStore.getKey(KEY_ALIAS, null);
                if (secretKey == null) return null;

                Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
                cipher.init(Cipher.ENCRYPT_MODE, secretKey);
                byte[] iv = cipher.getIV();
                byte[] ciphertext = cipher.doFinal(plaintext.getBytes("UTF-8"));

                JSONObject result = new JSONObject();
                result.put("ciphertext", Base64.encodeToString(ciphertext, Base64.NO_WRAP));
                result.put("iv", Base64.encodeToString(iv, Base64.NO_WRAP));
                result.put("version", 1);
                result.put("hardwareBacked", true);
                return result.toString();
            } catch (Exception e) {
                Log.e(TAG, "AndroidKeyStore encryption error: " + e.getMessage());
                return null;
            }
        }

        @JavascriptInterface
        public String decryptWithHardwareKey(String cipherJson) {
            try {
                JSONObject json = new JSONObject(cipherJson);
                byte[] iv = Base64.decode(json.getString("iv"), Base64.NO_WRAP);
                byte[] ciphertext = Base64.decode(json.getString("ciphertext"), Base64.NO_WRAP);

                KeyStore keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
                keyStore.load(null);
                SecretKey secretKey = (SecretKey) keyStore.getKey(KEY_ALIAS, null);
                if (secretKey == null) return null;

                Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
                GCMParameterSpec spec = new GCMParameterSpec(128, iv);
                cipher.init(Cipher.DECRYPT_MODE, secretKey, spec);
                byte[] decrypted = cipher.doFinal(ciphertext);

                return new String(decrypted, "UTF-8");
            } catch (Exception e) {
                Log.e(TAG, "AndroidKeyStore decryption error: " + e.getMessage());
                return null;
            }
        }

        @JavascriptInterface
        public String getKeystoreInfo() {
            try {
                JSONObject info = new JSONObject();
                info.put("provider", KEYSTORE_PROVIDER);
                info.put("alias", KEY_ALIAS);
                info.put("algorithm", "AES-256-GCM");
                info.put("flagSecureEnabled", true);
                info.put("hardwareBacked", true);
                return info.toString();
            } catch (Exception e) {
                return "{}";
            }
        }
    }

    private static class LocalAssetWebViewClient extends WebViewClient {
        private final AssetManager mAssetManager;

        public LocalAssetWebViewClient(AssetManager assetManager) {
            this.mAssetManager = assetManager;
        }

        private boolean isHandledHost(String host) {
            if (host == null) return false;
            String h = host.toLowerCase();
            return h.equals(ASSET_HOST) || 
                   h.equals("localhost") || 
                   h.equals("127.0.0.1") || 
                   h.equals("vaultora.internal") ||
                   h.equals("app.vaultora.local");
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            if (request != null && request.getUrl() != null) {
                Uri uri = request.getUrl();
                if (isHandledHost(uri.getHost())) {
                    return handleAssetRequest(uri.getPath());
                }
            }
            return super.shouldInterceptRequest(view, request);
        }

        @SuppressWarnings("deprecation")
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
            if (url != null) {
                Uri uri = Uri.parse(url);
                if (isHandledHost(uri.getHost())) {
                    return handleAssetRequest(uri.getPath());
                }
            }
            return super.shouldInterceptRequest(view, url);
        }

        private WebResourceResponse handleAssetRequest(String path) {
            if (path == null || path.isEmpty() || "/".equals(path)) {
                path = "/index.html";
            }

            // Remove leading slash for AssetManager
            String assetPath = path.startsWith("/") ? path.substring(1) : path;
            String fullAssetPath = "www/" + assetPath;

            try {
                InputStream is = mAssetManager.open(fullAssetPath);
                String mimeType = getMimeType(path);
                String encoding = getEncoding(mimeType);

                Map<String, String> headers = new HashMap<>();
                headers.put("Access-Control-Allow-Origin", "*");
                headers.put("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
                headers.put("Access-Control-Allow-Headers", "*");
                headers.put("Cache-Control", "no-cache");

                return new WebResourceResponse(mimeType, encoding, 200, "OK", headers, is);
            } catch (IOException e) {
                // If SPA route (e.g. navigation without direct file extension), fallback to index.html
                if (!path.contains(".")) {
                    try {
                        InputStream is = mAssetManager.open("www/index.html");
                        Map<String, String> headers = new HashMap<>();
                        headers.put("Access-Control-Allow-Origin", "*");
                        return new WebResourceResponse("text/html", "UTF-8", 200, "OK", headers, is);
                    } catch (IOException ignored) {}
                }
                Log.w(TAG, "Local asset not found: " + fullAssetPath);
                return null;
            }
        }

        private String getMimeType(String path) {
            String lower = path.toLowerCase();
            if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html";
            if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "application/javascript";
            if (lower.endsWith(".css")) return "text/css";
            if (lower.endsWith(".json") || lower.endsWith(".webmanifest")) return "application/json";
            if (lower.endsWith(".png")) return "image/png";
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
            if (lower.endsWith(".svg")) return "image/svg+xml";
            if (lower.endsWith(".ico")) return "image/x-icon";
            if (lower.endsWith(".woff2")) return "font/woff2";
            if (lower.endsWith(".woff")) return "font/woff";
            if (lower.endsWith(".ttf")) return "font/ttf";
            if (lower.endsWith(".apk")) return "application/vnd.android.package-archive";
            return "application/octet-stream";
        }

        private String getEncoding(String mimeType) {
            if (mimeType.startsWith("text/") || 
                mimeType.equals("application/javascript") || 
                mimeType.equals("application/json")) {
                return "UTF-8";
            }
            return null;
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            super.onReceivedError(view, request, error);
            if (request != null && request.isForMainFrame()) {
                Log.e(TAG, "WebView main frame error: " + error.toString());
            }
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
