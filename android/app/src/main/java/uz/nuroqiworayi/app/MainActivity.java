package uz.nuroqiworayi.app;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.content.ComponentName;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.content.res.ColorStateList;
import android.view.Gravity;
import android.view.View;
import android.os.SystemClock;
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
        "notifications-ui.css", "math-portal.css",
        "app-features.js", "premium-admin.js", "ranking-ui.js",
        "liquid-glass.js", "i18n.js", "contact-ui.js", "payment-ui.js", "portfolio-ui.js",
        "notifications-ui.js", "navigation-ui.js", "math-portal.js",
        "paynet_qr.png"
    ));
    private WebView webView;
    private FrameLayout splashOverlay;
    private long splashOpenedAt;
    private long lastBackRequestAt;
    private boolean splashFinished=false;
    private boolean backCheckInProgress=false;

    private int dp(float dp) {
        return Math.round(dp * getResources().getDisplayMetrics().density);
    }

    /** Branded, nonblocking native startup screen; real launcher icon is unchanged. */
    private FrameLayout makeSplash() {
        final FrameLayout splash=new FrameLayout(this);
        GradientDrawable background=new GradientDrawable(
            GradientDrawable.Orientation.TL_BR,
            new int[]{Color.rgb(11,51,38),Color.rgb(30,105,72)});
        splash.setBackground(background);

        LinearLayout stack=new LinearLayout(this);
        stack.setOrientation(LinearLayout.VERTICAL);
        stack.setGravity(Gravity.CENTER);
        stack.setPadding(dp(18),dp(18),dp(18),dp(18));

        ImageView icon=new ImageView(this);
        icon.setImageResource(R.drawable.nur_premium_icon);
        icon.setScaleType(ImageView.ScaleType.FIT_CENTER);
        LinearLayout.LayoutParams iconParams=new LinearLayout.LayoutParams(dp(122),dp(122));
        iconParams.bottomMargin=dp(23);
        stack.addView(icon,iconParams);

        TextView title=new TextView(this);
        title.setText("Nur oqiw");
        title.setTextColor(Color.rgb(239,255,244));
        title.setTextSize(22);
        title.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        title.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams titleParams=new LinearLayout.LayoutParams(-2,-2);
        titleParams.bottomMargin=dp(19);
        stack.addView(title,titleParams);

        ProgressBar line=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);
        line.setIndeterminate(true);
        line.setIndeterminateTintList(ColorStateList.valueOf(Color.rgb(184,237,204)));
        line.setProgressBackgroundTintList(ColorStateList.valueOf(Color.rgb(66,123,90)));
        stack.addView(line,new LinearLayout.LayoutParams(dp(178),dp(5)));
        splash.addView(stack,new FrameLayout.LayoutParams(-1,-1));
        return splash;
    }

    private void dismissSplash() {
        if(splashFinished || splashOverlay==null)return;
        splashFinished=true;
        final FrameLayout toHide=splashOverlay;
        // Brief real progress display, but never force a multi-second white frame.
        long elapsed=SystemClock.uptimeMillis()-splashOpenedAt;
        toHide.postDelayed(()->{
            if(isFinishing()||isDestroyed())return;
            toHide.animate().alpha(0f).setDuration(240L).withEndAction(()->{
                if(toHide.getParent() instanceof FrameLayout) {
                    ((FrameLayout)toHide.getParent()).removeView(toHide);
                }
                if(splashOverlay==toHide)splashOverlay=null;
            }).start();
        },Math.max(0L,650L-elapsed));
    }

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
        getWindow().setStatusBarColor(Color.rgb(11, 51, 38));
        getWindow().setNavigationBarColor(Color.rgb(11, 51, 38));
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(13, 62, 43));
        final WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        // Marker lets the bundled settings page offer Android-only launcher icon
        // variants without injecting a Javascript bridge.
        settings.setUserAgentString(settings.getUserAgentString()+" NurOqiwAndroid/1.0");
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
            @Override public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view,url);
                if(url!=null && url.startsWith(HOME))dismissSplash();
            }
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
                if ("nuricon".equals(uri.getScheme())) {
                    // Strictly allowlisted internal icon selection, no remote or
                    // third-party page is loaded inside this WebView.
                    if("change".equalsIgnoreCase(uri.getHost()) &&
                       uri.getPath()!=null &&
                       uri.getPath().matches("^/(original|emerald|night)$")) {
                        try {
                            changeLauncherIcon(uri.getPath().substring(1));
                        } catch (Exception iconError) {
                            Log.w("NurOqiwIcon","Cannot change launcher alias",iconError);
                            Toast.makeText(MainActivity.this,
                                "Bosh ekran ikonkasi o‘zgarmadi",Toast.LENGTH_SHORT).show();
                        }
                    }
                    return true;
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
        splashOpenedAt=SystemClock.uptimeMillis();
        splashOverlay=makeSplash();
        layout.addView(splashOverlay,new FrameLayout.LayoutParams(-1,-1));
        setContentView(layout);
        // Handle the Android 13+ system gesture via the same safe in-app stack.
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::handleBack);
        }
        // Safety fallback prevents indefinite blocking if a WebView error occurs.
        splashOverlay.postDelayed(this::dismissSplash,9000L);
        if (savedInstanceState == null) webView.loadUrl(HOME);
        else webView.restoreState(savedInstanceState);
    }

    @Override protected void onSaveInstanceState(Bundle state) {
        if (webView != null) webView.saveState(state);
        super.onSaveInstanceState(state);
    }
    private void changeLauncherIcon(String variant) {
        final String prefix=getPackageName()+".Launcher";
        final String chosen;
        if("emerald".equals(variant)) chosen="Emerald";
        else if("night".equals(variant)) chosen="Night";
        else chosen="Original";
        PackageManager pm=getPackageManager();
        String[] aliases={"Original","Emerald","Night"};
        // Enable the destination before disabling alternatives, so the app
        // never loses all launcher entrypoints.
        pm.setComponentEnabledSetting(new ComponentName(this,prefix+chosen),
            PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
            PackageManager.DONT_KILL_APP);
        for(String item:aliases){
            if(!chosen.equals(item)){
                pm.setComponentEnabledSetting(new ComponentName(this,prefix+item),
                    PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                    PackageManager.DONT_KILL_APP);
            }
        }
        Toast.makeText(this,"Ikonka yangilandi",Toast.LENGTH_SHORT).show();
    }

    private void confirmExit() {
        long now=SystemClock.uptimeMillis();
        if(now-lastBackRequestAt<=1900L) {
            finish();
        } else {
            lastBackRequestAt=now;
            Toast.makeText(this,"Ilovadan chiqish uchun yana bir marta Orqaga bosing",Toast.LENGTH_SHORT).show();
        }
    }

    private void handleBack() {
        if(webView==null||backCheckInProgress){return;}
        backCheckInProgress=true;
        // SPA page navigation does not add WebView URL history. Ask the JS
        // navigation stack to go back by exactly one view first.
        webView.evaluateJavascript(
            "(function(){try{return typeof window.NurAndroidBack==='function' && window.NurAndroidBack()===true}catch(e){return false}})();",
            result->{
                backCheckInProgress=false;
                if(isFinishing()||isDestroyed())return;
                if("true".equals(result))return;
                if(webView!=null && webView.canGoBack()){
                    webView.goBack();return;
                }
                confirmExit();
            });
    }

    @Override public void onBackPressed() {handleBack();}
    @Override protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
