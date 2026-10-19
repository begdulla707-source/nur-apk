package uz.nuroqiworayi.app;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.widget.FrameLayout;
import android.widget.Toast;
import java.io.OutputStream;

public class MainActivity extends Activity {
    private static final String HOME = "https://nur-apk.vercel.app/";
    private static final String TRUSTED_HOST = "nur-apk.vercel.app";
    private static final int CREATE_CSV_REQUEST = 2401;
    private static final int MAX_CSV_BYTES = 1024 * 1024;
    private WebView webView;
    private byte[] pendingCsv;

    private boolean isTrustedPage() {
        if (webView == null || webView.getUrl() == null) return false;
        Uri u = Uri.parse(webView.getUrl());
        return "https".equals(u.getScheme()) && TRUSTED_HOST.equalsIgnoreCase(u.getHost());
    }

    public final class SafeExportBridge {
        @JavascriptInterface
        public void saveCsv(String filename, String encodedText) {
            if (filename == null || encodedText == null || encodedText.length() > MAX_CSV_BYTES * 2) return;
            final String clean = filename.replaceAll("[^a-zA-Z0-9._-]", "_");
            if (!clean.toLowerCase().endsWith(".csv") || clean.length() > 100 || clean.length() < 5) return;
            final byte[] data;
            try { data = Base64.decode(encodedText, Base64.DEFAULT); }
            catch (Exception ignored) { return; }
            if (data.length == 0 || data.length > MAX_CSV_BYTES) return;
            runOnUiThread(() -> {
                // Never allow untrusted websites to invoke the native export bridge.
                if (!isTrustedPage()) return;
                pendingCsv = data;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("text/csv");
                intent.putExtra(Intent.EXTRA_TITLE, clean);
                try {
                    startActivityForResult(intent, CREATE_CSV_REQUEST);
                } catch (Exception e) {
                    pendingCsv = null;
                    Toast.makeText(MainActivity.this, "Faylni saqlash oynasi ochilmadi", Toast.LENGTH_LONG).show();
                }
            });
        }
    }

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(15, 72, 58));
        getWindow().setNavigationBarColor(Color.rgb(239, 246, 241));
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(239, 246, 241));
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setAllowFileAccess(false);
        webView.getSettings().setAllowContentAccess(false);
        webView.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        webView.addJavascriptInterface(new SafeExportBridge(), "NurFiles");
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) &&
                    TRUSTED_HOST.equalsIgnoreCase(uri.getHost())) {
                    return false;
                }
                if ("https".equals(uri.getScheme()) || "mailto".equals(uri.getScheme())) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    } catch (Exception ignored) {}
                }
                return true;
            }
        });
        if (android.os.Build.VERSION.SDK_INT >= 26) webView.getSettings().setSafeBrowsingEnabled(true);
        FrameLayout layout = new FrameLayout(this);
        layout.addView(webView, new FrameLayout.LayoutParams(-1, -1));
        setContentView(layout);
        if (savedInstanceState == null) webView.loadUrl(HOME);
        else webView.restoreState(savedInstanceState);
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent result) {
        super.onActivityResult(requestCode, resultCode, result);
        if (requestCode == CREATE_CSV_REQUEST) {
            byte[] data = pendingCsv;
            pendingCsv = null;
            if (resultCode != RESULT_OK || data == null || result == null || result.getData() == null) return;
            try (OutputStream stream = getContentResolver().openOutputStream(result.getData())) {
                if (stream == null) throw new IllegalStateException("File access denied");
                stream.write(data);
                stream.flush();
                Toast.makeText(this, "CSV fayli saqlandi", Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                Toast.makeText(this, "CSV saqlashda xatolik", Toast.LENGTH_LONG).show();
            }
        }
    }

    @Override protected void onSaveInstanceState(Bundle state) {
        webView.saveState(state);
        super.onSaveInstanceState(state);
    }
    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
    @Override protected void onDestroy() {
        if (webView != null) {
            webView.removeJavascriptInterface("NurFiles");
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
