package uz.nuroqiworayi.app;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.content.ComponentName;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.animation.ObjectAnimator;
import android.graphics.drawable.ClipDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.view.animation.LinearInterpolator;
import android.net.Uri;
import android.webkit.WebChromeClient;
import android.webkit.ValueCallback;
import android.content.ClipData;
import android.database.Cursor;
import android.graphics.Rect;
import android.provider.OpenableColumns;
import org.json.JSONArray;
import org.json.JSONObject;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;
import java.util.ArrayList;
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
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import com.google.android.gms.tasks.Tasks;

/**
 * Offline-first Nur oqiw orayi Android client, separate from the Telegram bot.
 * The interface is bundled inside the APK and loaded from a secure HTTPS-like
 * origin. Only explicit static assets can be served by this WebViewClient.
 *
 * The independent Render API is contacted when internet is available.
 * No native Javascript bridge or broad storage permissions. Explicitly selected\n * photos are OCR-scanned on-device and returned for admin review only.
 */
public class MainActivity extends Activity {
    private static final String APP_HOST = "appassets.androidplatform.net";
    private static final String HOME = "https://" + APP_HOST + "/assets/index.html";
    private static final Set<String> WEB_ASSETS = new HashSet<String>(Arrays.asList(
        "index.html", "features.css", "premium-admin.css", "ranking-ui.css",
        "liquid-glass.css", "polish-v08.css", "payment-ui.css", "portfolio-ui.css",
        "notifications-ui.css", "math-portal.css", "math-portal.css",
        "app-features.js", "premium-admin.js", "ranking-ui.js",
        "liquid-glass.js", "i18n.js", "contact-ui.js", "payment-ui.js", "portfolio-ui.js",
        "notifications-ui.js", "navigation-ui.js", "math-ocr.js", "nur-icon-previews.js", "math-portal.js", "nur_premium_icon.webp",
        "paynet_qr.png"
    ));
    private static final int FILE_CHOOSER_CODE = 5042;
    private ValueCallback<Uri[]> pendingFileUris;
    private TextRecognizer imageTextRecognizer;
    // Decode and scan photos serially off the UI thread to prevent freezes.
    private final ExecutorService ocrExecutor=Executors.newSingleThreadExecutor();
    private WebView webView;
    private FrameLayout splashOverlay;
    private ProgressBar splashProgress;
    private ObjectAnimator splashAnimator;
    private long splashOpenedAt;
    private long lastBackRequestAt;
    private boolean splashFinished=false;
    private boolean backCheckInProgress=false;

    private int dp(float dp) {
        return Math.round(dp * getResources().getDisplayMetrics().density);
    }

    /** The original NUR mark is the only startup content. */
    private FrameLayout makeSplash() {
        FrameLayout splash=new FrameLayout(this);
        GradientDrawable background=new GradientDrawable(
            GradientDrawable.Orientation.TL_BR,
            new int[]{Color.rgb(11,51,38),Color.rgb(30,105,72)});
        splash.setBackground(background);
        ImageView icon=new ImageView(this);
        icon.setImageResource(R.drawable.nur_premium_icon);
        icon.setScaleType(ImageView.ScaleType.FIT_CENTER);
        FrameLayout.LayoutParams center=new FrameLayout.LayoutParams(
            dp(146),dp(146),Gravity.CENTER);
        splash.addView(icon,center);
        return splash;
    }
    private void dismissSplash() {
        if(splashFinished||splashOverlay==null)return;
        splashFinished=true;
        final FrameLayout overlay=splashOverlay;
        overlay.animate().alpha(0f).setDuration(120L).withEndAction(()->{
            if(overlay.getParent() instanceof FrameLayout)
                ((FrameLayout)overlay.getParent()).removeView(overlay);
            if(splashOverlay==overlay)splashOverlay=null;
        }).start();
    }
    private void restoreOriginalLauncherIcon(){
        // Older builds offered icon switching. Re-enable only the original
        // launcher entry on every start, including upgrades.
        String[] aliases={"Original","Emerald","Night",
            "AutumnOne","AutumnTwo","Spring","Winter"};
        PackageManager manager=getPackageManager();
        for(String alias:aliases){
            try{
                manager.setComponentEnabledSetting(
                    new ComponentName(this,getPackageName()+".Launcher"+alias),
                    alias.equals("Original")
                        ?PackageManager.COMPONENT_ENABLED_STATE_ENABLED
                        :PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                    PackageManager.DONT_KILL_APP);
            }catch(Exception e){Log.w("NurOqiwLauncher","Launcher entry unavailable",e);}
        }
        getPreferences(MODE_PRIVATE).edit().remove("launcher_icon").apply();
    }

    private WebResourceResponse deny() {
        return new WebResourceResponse("text/plain", "UTF-8",
            new ByteArrayInputStream("Not found".getBytes(StandardCharsets.UTF_8)));
    }

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        restoreOriginalLauncherIcon();
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
        // Content access is needed only for explicit Android document-picker
        // results; file:// access remains disabled.
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        if (android.os.Build.VERSION.SDK_INT >= 26) {
            settings.setSafeBrowsingEnabled(true);
        }
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(
                    WebView view, ValueCallback<Uri[]> callback,
                    WebChromeClient.FileChooserParams params) {
                if(pendingFileUris!=null)pendingFileUris.onReceiveValue(null);
                pendingFileUris=callback;
                try {
                    Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType("*/*");
                    intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,true);
                    intent.putExtra(Intent.EXTRA_MIME_TYPES,new String[]{
                        "text/csv","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        "image/jpeg","image/png","image/webp","application/octet-stream"
                    });
                    startActivityForResult(Intent.createChooser(intent,
                        "Excel, CSV yoki rasm fayllarini tanlang"),FILE_CHOOSER_CODE);
                } catch(Exception error) {
                    Log.w("NurOqiwFiles","File chooser failed",error);
                    pendingFileUris.onReceiveValue(null);
                    pendingFileUris=null;
                }
                return true;
            }
        });
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
                if (asset.endsWith(".webp")) mime = "image/webp";
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
        splashOverlay.postDelayed(this::dismissSplash,1000L);
        if (savedInstanceState == null) webView.loadUrl(HOME);
        else webView.restoreState(savedInstanceState);
    }

    @Override protected void onActivityResult(int requestCode,int resultCode,Intent intent) {
        super.onActivityResult(requestCode,resultCode,intent);
        if(requestCode!=FILE_CHOOSER_CODE)return;
        ValueCallback<Uri[]> callback=pendingFileUris;
        pendingFileUris=null;
        if(callback==null)return;
        if(resultCode!=RESULT_OK||intent==null) {
            callback.onReceiveValue(null);return;
        }
        ArrayList<Uri> files=new ArrayList<>();
        ClipData clips=intent.getClipData();
        if(clips!=null){
            int count=Math.min(clips.getItemCount(),8);
            for(int i=0;i<count;i++) {
                Uri uri=clips.getItemAt(i).getUri();
                if(uri!=null)files.add(uri);
            }
        }else if(intent.getData()!=null){
            files.add(intent.getData());
        }
        callback.onReceiveValue(files.isEmpty()?null:files.toArray(new Uri[0]));
        // The WebView cannot OCR image bytes by itself. Recognize selected
        // photos locally and send only editable suggestions to the UI.
        for(Uri uri:files) if(isResultImage(uri))recognizeResultImage(uri);
    }


    private String selectedFileName(Uri uri) {
        try(Cursor c=getContentResolver().query(uri,
                new String[]{OpenableColumns.DISPLAY_NAME},null,null,null)) {
            if(c!=null && c.moveToFirst())return c.getString(0);
        }catch(Exception ignored){ }
        return uri.getLastPathSegment()==null?"natija-rasm.jpg":uri.getLastPathSegment();
    }

    private boolean isResultImage(Uri uri) {
        try {
            String mime=getContentResolver().getType(uri);
            if(mime!=null && mime.startsWith("image/"))return true;
            String name=selectedFileName(uri).toLowerCase(java.util.Locale.ROOT);
            return name.endsWith(".png")||name.endsWith(".jpg")||
                name.endsWith(".jpeg")||name.endsWith(".webp");
        } catch(Exception error){return false;}
    }

    private void sendImageOCRResult(JSONObject payload) {
        if(webView==null||isFinishing()||isDestroyed())return;
        // JSONObject.toString safely quotes OCR words; no native JS interface,
        // WebView file access or embedded external OCR endpoint required.
        final String js="window.NurImageOCRDeliver&&window.NurImageOCRDeliver("+
            payload.toString()+");";
        webView.post(()->{
            if(webView!=null&&!isFinishing()&&!isDestroyed())
                webView.evaluateJavascript(js,null);
        });
    }

    private void recognizeResultImage(Uri uri) {
        final String fileName=selectedFileName(uri);
        if(imageTextRecognizer==null)
            imageTextRecognizer=TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
        final TextRecognizer engine=imageTextRecognizer;
        ocrExecutor.execute(()->{
            JSONObject payload=new JSONObject();
            try{
                // Android image decoding and ML Kit inference must not block
                // the main/UI thread, especially for large camera photographs.
                final InputImage image=InputImage.fromFilePath(this,uri);
                final int width=Math.max(1,image.getWidth());
                final int height=Math.max(1,image.getHeight());
                final Text result=Tasks.await(engine.process(image),18,TimeUnit.SECONDS);
                JSONArray words=new JSONArray();
                payload.put("file",fileName);
                for(Text.TextBlock block:result.getTextBlocks()){
                    for(Text.Line line:block.getLines()){
                        for(Text.Element element:line.getElements()){
                            Rect rect=element.getBoundingBox();
                            if(rect==null||words.length()>=1600)continue;
                            JSONObject word=new JSONObject();
                            word.put("text",element.getText());
                            word.put("x",(double)rect.left/width);
                            word.put("y",(double)rect.top/height);
                            word.put("w",(double)rect.width()/width);
                            word.put("h",(double)rect.height()/height);
                            words.put(word);
                        }
                    }
                }
                payload.put("elements",words);
                payload.put("engine","android-mlkit-latin");
            }catch(Exception error){
                Log.w("NurOqiwOCR","OCR failed for selected photo",error);
                try{
                    payload.put("file",fileName);
                    payload.put("elements",new JSONArray());
                    payload.put("error","Rasm matnini aniqlab bo‘lmadi. Tiniqroq rasm tanlang.");
                }catch(Exception ignored){}
            }
            sendImageOCRResult(payload);
        });
    }

    @Override protected void onSaveInstanceState(Bundle state) {
        if (webView != null) webView.saveState(state);
        super.onSaveInstanceState(state);
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
        ocrExecutor.shutdownNow();
        if(imageTextRecognizer!=null){
            imageTextRecognizer.close();
            imageTextRecognizer=null;
        }
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
