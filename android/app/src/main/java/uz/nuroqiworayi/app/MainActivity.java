package uz.nuroqiworayi.app;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.widget.FrameLayout;
import android.util.Log;
import com.google.firebase.FirebaseApp;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Offline-first Nur oqiw orayi Android client, separate from the Telegram bot.
 * The interface is bundled inside the APK and loaded from a secure HTTPS-like
 * origin. Only explicit static assets can be served by this WebViewClient.
 *
 * The independent Render API is contacted when internet is available.
 * No native Javascript bridge, file permissions or native download mechanism.
 */
public class MainActivity extends Activity {
    private static final String APP_HOST = "appassets.androidplatform.net";
    private static final String HOME = "https://" + APP_HOST + "/assets/index.html";
    private static final Set<String> WEB_ASSETS = new HashSet<String>(Arrays.asList(
        "index.html", "features.css", "premium-admin.css", "ranking-ui.css",
        "liquid-glass.css", "polish-v08.css", "payment-ui.css", "portfolio-ui.css",
        "app-features.js", "premium-admin.js", "ranking-ui.js",
        "liquid-glass.js", "i18n.js", "contact-ui.js", "payment-ui.js", "portfolio-ui.js",
        "paynet_qr.png"
    ));
    private WebView webView;

    private WebResourceResponse deny() {
        return new WebResourceResponse("text/plain", "UTF-8",
            new ByteArrayInputStream("Not found".getBytes(StandardCharsets.UTF_8)));
    }

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Google Services supplies Android-package-matched Firebase options.
        // A missing/mismatched configuration is logged, never hard-coded
        // into the offline HTML or exposed to the WebView.
        try {
            FirebaseApp app = FirebaseApp.initializeApp(getApplicationContext());
            if (app == null) Log.w("NurOqiwFirebase", "Firebase config unavailable");
            else Log.i("NurOqiwFirebase", "Firebase initialized for Android app");
        } catch (Exception exception) {
            Log.e("NurOqiwFirebase", "Firebase initialization failed", exception);
        }
        getWindow().setStatusBarColor(Color.rgb(15, 72, 58));
        getWindow().setNavigationBarColor(Color.rgb(239, 246, 241));
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(239, 246, 241));
        final WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        if (android.os.Build.VERSION.SDK_INT >= 26) {
            settings.setSafeBrowsingEnabled(true);
        }
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(
                    WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!"https".equals(uri.getScheme()) ||
                    !APP_HOST.equalsIgnoreCase(uri.getHost())) return null;
                String path = uri.getPath();
                if (path == null || !path.startsWith("/assets/")) return deny();
                String asset = path.substring("/assets/".length());
                if (!WEB_ASSETS.contains(asset)) return deny();
                String mime = "text/html";
                if (asset.endsWith(".css")) mime = "text/css";
                if (asset.endsWith(".js")) mime = "application/javascript";
                if (asset.endsWith(".png")) mime = "image/png";
                try {
                    return new WebResourceResponse(mime, "UTF-8", getAssets().open(asset));
                } catch (IOException e) {
                    return deny();
                }
            }
            @Override public boolean shouldOverrideUrlLoading(
                    WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) &&
                    APP_HOST.equalsIgnoreCase(uri.getHost()) &&
                    uri.getPath() != null && uri.getPath().startsWith("/assets/")) {
                    return false;
                }
                if ("tel".equals(uri.getScheme())) {
                    try {
                        // Open the dialer; never place a call without the user's action.
                        startActivity(new Intent(Intent.ACTION_DIAL, uri));
                    } catch (Exception ignored) { }
                    return true;
                }
                if ("https".equals(uri.getScheme()) || "mailto".equals(uri.getScheme())) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    } catch (Exception ignored) { }
                }
                return true;
            }
        });
        FrameLayout layout = new FrameLayout(this);
        layout.addView(webView, new FrameLayout.LayoutParams(-1, -1));
        setContentView(layout);
        if (savedInstanceState == null) webView.loadUrl(HOME);
        else webView.restoreState(savedInstanceState);
    }

    @Override protected void onSaveInstanceState(Bundle state) {
        if (webView != null) webView.saveState(state);
        super.onSaveInstanceState(state);
    }
    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
    @Override protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
