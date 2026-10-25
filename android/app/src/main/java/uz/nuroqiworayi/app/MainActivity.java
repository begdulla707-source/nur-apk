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
        "notifications-ui.js", "navigation-ui.js", "math-ocr.js", "math-portal.js",
        "paynet_qr.png"
    ));
    private static final int FILE_CHOOSER_CODE = 5042;
    private ValueCallback<Uri[]> pendingFileUris;
    private TextRecognizer imageTextRecognizer;
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
        icon.setImageResource(getSelectedLauncherIcon());
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
        // An iOS-like, visibly thick rounded track filling once from 0 to 100.
        GradientDrawable track=new GradientDrawable();
        track.setColor(Color.argb(95,216,251,229));
        track.setCornerRadius(dp(7));
        GradientDrawable fill=new GradientDrawable(
            GradientDrawable.Orientation.LEFT_RIGHT,
            new int[]{Color.rgb(202,254,222),Color.rgb(255,225,146)});
        fill.setCornerRadius(dp(7));
        ClipDrawable clipped=new ClipDrawable(fill,Gravity.LEFT,ClipDrawable.HORIZONTAL);
        LayerDrawable drawable=new LayerDrawable(new Drawable[]{track,clipped});
        drawable.setId(0,android.R.id.background);
        drawable.setId(1,android.R.id.progress);
        line.setProgressDrawable(drawable);
        line.setIndeterminate(false);
        line.setMax(100);
        line.setProgress(0);
        splashProgress=line;
        stack.addView(line,new LinearLayout.LayoutParams(dp(206),dp(6)));
        splash.addView(stack,new FrameLayout.LayoutParams(-1,-1));
        return splash;
    }

    private void dismissSplash() {
        if(splashFinished || splashOverlay==null)return;
        splashFinished=true;
        if(splashAnimator!=null){
            splashAnimator.cancel();
            splashAnimator=null;
        }
        final FrameLayout overlay=splashOverlay;
        final ProgressBar bar=splashProgress;
        long elapsed=SystemClock.uptimeMillis()-splashOpenedAt;
        overlay.postDelayed(()->{
            if(isFinishing()||isDestroyed())return;
            if(bar!=null){
                ObjectAnimator last=ObjectAnimator.ofInt(bar,"progress",bar.getProgress(),100);
                last.setDuration(320L);
                last.start();
            }
            overlay.postDelayed(()->{
                if(isFinishing()||isDestroyed())return;
                overlay.animate().alpha(0f).setDuration(230L).withEndAction(()->{
                    if(overlay.getParent() instanceof FrameLayout)
                        ((FrameLayout)overlay.getParent()).removeView(overlay);
                    if(splashOverlay==overlay)splashOverlay=null;
                    splashProgress=null;
                }).start();
            },325L);
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
                       uri.getPath().matches("^/(original|emerald|night|autumn-one|autumn-two|spring|winter)$")) {
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
        animateSplashProgress();
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
        try {
            if(imageTextRecognizer==null){
                imageTextRecognizer=TextRecognition.getClient(
                    TextRecognizerOptions.DEFAULT_OPTIONS);
            }
            final InputImage image=InputImage.fromFilePath(this,uri);
            final int width=Math.max(1,image.getWidth());
            final int height=Math.max(1,image.getHeight());
            imageTextRecognizer.process(image)
              .addOnSuccessListener(result->{
                JSONObject payload=new JSONObject();
                JSONArray words=new JSONArray();
                try{
                    payload.put("file",fileName);
                    for(Text.TextBlock block:result.getTextBlocks()) {
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
                }catch(Exception jsonError){
                    Log.w("NurOqiwOCR","Cannot encode OCR words",jsonError);
                }
                sendImageOCRResult(payload);
              })
              .addOnFailureListener(error->{
                JSONObject response=new JSONObject();
                try {
                    response.put("file",fileName);
                    response.put("elements",new JSONArray());
                    response.put("error","Rasm matnini tanib bo\\u2018lmadi. Tiniqroq rasm tanlang.");
                }catch(Exception ignored){}
                Log.w("NurOqiwOCR","Recognition failed",error);
                sendImageOCRResult(response);
              });
        }catch(Exception error){
            JSONObject response=new JSONObject();
            try {
                response.put("file",fileName);
                response.put("elements",new JSONArray());
                response.put("error","Rasmni ochib bo\\u2018lmadi.");
            }catch(Exception ignored){}
            Log.w("NurOqiwOCR","Photo could not be opened",error);
            sendImageOCRResult(response);
        }
    }

    @Override protected void onSaveInstanceState(Bundle state) {
        if (webView != null) webView.saveState(state);
        super.onSaveInstanceState(state);
    }
    private int getSelectedLauncherIcon(){
        String mode=getPreferences(MODE_PRIVATE).getString("launcher_icon","original");
        switch(mode){
            case "emerald":return R.drawable.nur_icon_emerald;
            case "night":return R.drawable.nur_icon_night;
            case "autumn-one":return R.drawable.nur_icon_autumn_one;
            case "autumn-two":return R.drawable.nur_icon_autumn_two;
            case "spring":return R.drawable.nur_icon_spring;
            case "winter":return R.drawable.nur_icon_winter;
            default:return R.drawable.nur_premium_icon;
        }
    }
    private void animateSplashProgress(){
        if(splashProgress==null)return;
        splashAnimator=ObjectAnimator.ofInt(splashProgress,"progress",0,96);
        splashAnimator.setInterpolator(new LinearInterpolator());
        splashAnimator.setDuration(7900L);
        splashAnimator.start();
    }
    private void changeLauncherIcon(String variant){
        String[] names={"Original","Emerald","Night","AutumnOne","AutumnTwo","Spring","Winter"};
        String[] modes={"original","emerald","night","autumn-one","autumn-two","spring","winter"};
        int target=0;
        for(int i=0;i<modes.length;i++)if(modes[i].equals(variant))target=i;
        PackageManager pm=getPackageManager();
        String prefix=getPackageName()+".Launcher";
        pm.setComponentEnabledSetting(new ComponentName(this,prefix+names[target]),
            PackageManager.COMPONENT_ENABLED_STATE_ENABLED,PackageManager.DONT_KILL_APP);
        for(int i=0;i<names.length;i++)if(i!=target)
            pm.setComponentEnabledSetting(new ComponentName(this,prefix+names[i]),
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED,PackageManager.DONT_KILL_APP);
        getPreferences(MODE_PRIVATE).edit().putString("launcher_icon",modes[target]).apply();
        Toast.makeText(this,"Ikonka saqlandi",Toast.LENGTH_SHORT).show();
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
