const fs = require("fs");
const { app, BrowserWindow } = require("electron");
const path = require("path");

const LOG = "[admin-main]";

let mainWindow;

console.log(LOG, "스크립트 로드");

/**
 * .env 파일 로드
 */
function loadEnvFile() {
    try {
        const envPath = path.join(__dirname, "..", "..", ".env");
        console.log(LOG, ".env 경로:", envPath);

        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, "utf-8");

            envContent.split("\n").forEach((line) => {
                const trimmedLine = line.trim();
                if (trimmedLine && !trimmedLine.startsWith("#")) {
                    const equalIndex = trimmedLine.indexOf("=");
                    if (equalIndex > 0) {
                        const key = trimmedLine.substring(0, equalIndex).trim();
                        const value = trimmedLine
                            .substring(equalIndex + 1)
                            .trim()
                            .replace(/^["']|["']$/g, "");

                        if (key && value) process.env[key] = value;
                    }
                }
            });

            console.log(LOG, ".env 로드 완료, SUPABASE_URL 있음:", !!process.env.SUPABASE_URL);
        } else {
            console.warn(LOG, ".env 파일 없음:", envPath);
        }
    } catch (error) {
        console.error(LOG, ".env 로드 오류:", error);
    }
}

loadEnvFile();

/**
 * 메인 윈도우 생성
 */
function createWindow() {
    console.log(LOG, "createWindow 호출");
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false, // ⭐⭐⭐ 중요
        },
    });

    mainWindow.loadFile("src/index.html");
    console.log(LOG, "loadFile(src/index.html) 요청함");

    // 개발자 도구 항상 열기
    mainWindow.webContents.openDevTools();
    console.log(LOG, "DevTools 열기 호출");

    // did-finish-load 이벤트로 페이지 로드 확인
    mainWindow.webContents.on("did-finish-load", () => {
        console.log(LOG, "페이지 로드 완료");
    });

    // preload 스크립트 에러 확인
    mainWindow.webContents.on("preload-error", (event, preloadPath, error) => {
        console.error(LOG, "preload 에러:", preloadPath, error);
    });
}

app.whenReady().then(() => {
    console.log(LOG, "app.whenReady 완료 → createWindow");
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
