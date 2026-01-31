const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

const LOG = "[board-main]";
console.log(LOG, "스크립트 로드");

function loadEnvFile() {
    const envPath = path.join(__dirname, "..", "..", ".env");
    if (!fs.existsSync(envPath)) {
        console.warn(LOG, ".env 없음:", envPath);
        return;
    }
    const env = fs.readFileSync(envPath, "utf-8");
    env.split("\n").forEach(line => {
        const l = line.trim();
        if (!l || l.startsWith("#")) return;
        const i = l.indexOf("=");
        if (i < 0) return;
        const k = l.slice(0, i).trim();
        const v = l.slice(i + 1).trim().replace(/^["']|["']$/g, "");
        process.env[k] = v;
    });
    console.log(LOG, ".env 로드 완료, SUPABASE_URL 있음:", !!process.env.SUPABASE_URL);
}

loadEnvFile();

function createWindow() {
    console.log(LOG, "createWindow 호출");
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,   // ⭐⭐⭐ 중요: 이거 없으면 supabase 모듈 로드 터짐
        },
    });

    win.loadFile("src/index.html");

    // 개발자 도구 항상 열기
    win.webContents.openDevTools();
    console.log(LOG, "DevTools 열기 호출");

    // 페이지 로드 확인
    win.webContents.on("did-finish-load", () => {
        console.log(LOG, "페이지 로드 완료");
    });
}

app.whenReady().then(() => {
    console.log(LOG, "app.whenReady 완료 → createWindow");
    createWindow();
});
