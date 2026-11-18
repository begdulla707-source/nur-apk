"use strict";
const {app, BrowserWindow, Menu, shell, dialog, session} = require("electron");
const path = require("node:path");

const HOME = "https://nur-apk.mcweb.uz/";
let mainWindow = null;
let recovering = false;
let downloadWired = false;
app.commandLine.appendSwitch("disable-features","MediaRouter");

function safeExternal(raw) {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && (
      u.hostname === "t.me" ||
      u.hostname === "telegram.me" ||
      u.hostname === "github.com" ||
      u.hostname === "nur.mcweb.uz" ||
      u.hostname === "nur-apk.mcweb.uz"
    );
  } catch (_) { return false; }
}
function isAppLocation(raw) {
  try {
    const u = new URL(raw);
    return u.origin === new URL(HOME).origin && u.protocol === "https:";
  } catch (_) { return false; }
}
function openExternal(raw) {
  if (safeExternal(raw)) shell.openExternal(raw).catch(() => {});
}
function wireDownloads() {
  if (downloadWired) return;
  downloadWired = true;
  session.defaultSession.on("will-download",(_event,item)=>{
    // Native Save As dialog is available through Chromium; no silent changes
    // to the user's files and no elevated Windows permissions.
    item.on("done",(_evt,state)=>{
      if (state === "completed" && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("nur-download-finished", item.getFilename());
      }
    });
  });
}
function loadHome() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  recovering = false;
  mainWindow.loadURL(HOME);
}
function createWindow() {
  Menu.setApplicationMenu(null);
  mainWindow = new BrowserWindow({
    title: "Nur oqiw orayi",
    width: 1440,
    height: 900,
    minWidth: 940,
    minHeight: 630,
    center:true,
    show:false,
    backgroundColor:"#051a12",
    autoHideMenuBar:true,
    webPreferences: {
      nodeIntegration:false,
      contextIsolation:true,
      sandbox:true,
      webSecurity:true,
      allowRunningInsecureContent:false,
      devTools:false,
      spellcheck:false
    }
  });
  wireDownloads();
  mainWindow.once("ready-to-show",()=>mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({url})=>{
    openExternal(url);
    return {action:"deny"};
  });
  mainWindow.webContents.on("will-navigate",(event,url)=>{
    if (isAppLocation(url)) return;
    event.preventDefault();
    openExternal(url);
  });
  mainWindow.webContents.on("did-fail-load",(_event,code,_desc,url,isMainFrame)=>{
    if (!isMainFrame || code === -3 || recovering || !isAppLocation(url)) return;
    recovering = true;
    mainWindow.loadFile(path.join(__dirname,"offline.html")).catch(()=>{});
  });
  mainWindow.webContents.on("before-input-event",(event,input)=>{
    if(input.key==="F5" || (input.control && input.key.toLowerCase()==="r")){
      event.preventDefault();loadHome();
    }
  });
  loadHome();
}
app.whenReady().then(()=>{
  app.on("web-contents-created",(_e,contents)=>{
    contents.on("will-attach-webview",event=>event.preventDefault());
  });
  createWindow();
  app.on("activate",()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()});
});
app.on("window-all-closed",()=>{if(process.platform!=="darwin")app.quit()});
