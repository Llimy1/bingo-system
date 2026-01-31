const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const LOG = "[draw-main]";
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

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(LOG, "SUPABASE ENV 없음");
    throw new Error("❌ SUPABASE ENV missing");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log(LOG, "Supabase 클라이언트 생성됨");

// =======================
// Window
// =======================
function createWindow() {
    console.log(LOG, "createWindow 호출");
    const win = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, "preload-direct.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
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

app.whenReady().then(createWindow);

// =======================
// IPC API
// =======================

// 게임 상태 읽기 (행 없으면 null)
ipcMain.handle("getGameState", async () => {
    console.log(LOG, "IPC getGameState 호출");
    const { data, error } = await supabase
        .from("game_state")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error) console.error(LOG, "getGameState 에러:", error);
    console.log(LOG, "getGameState 결과:", data ? data.status : null);
    return data;
});

// 뽑힌 번호들
ipcMain.handle("getDrawnNumbers", async () => {
    console.log(LOG, "IPC getDrawnNumbers 호출");
    const { data, error } = await supabase
        .from("drawn_numbers")
        .select("number")
        .order("drawn_at");
    if (error) console.error(LOG, "getDrawnNumbers 에러:", error);
    console.log(LOG, "getDrawnNumbers 결과 개수:", data?.length ?? 0);
    return data || [];
});

// 번호 insert
ipcMain.handle("insertNumber", async (e, number) => {
    console.log(LOG, "IPC insertNumber 호출 number=", number);
    const { error } = await supabase
        .from("drawn_numbers")
        .insert({ number });
    if (error) {
        console.error(LOG, "insertNumber 에러:", error);
        throw error;
    }
    console.log(LOG, "insertNumber 완료");
    return true;
});

// game_state realtime
ipcMain.handle("subscribeGameState", async (event) => {
    console.log(LOG, "IPC subscribeGameState 호출");
    const win = BrowserWindow.fromWebContents(event.sender);

    // 고유한 채널 이름 생성
    const channelName = `draw-game-state-${Date.now()}`;
    console.log(LOG, "채널 이름:", channelName);

    supabase
        .channel(channelName)
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "game_state" },
            payload => {
                console.log(LOG, "Realtime game_state 수신:", payload?.new?.status);
                if (win && !win.isDestroyed() && payload?.new) {
                    win.webContents.send("gameStateChanged", payload.new);
                    console.log(LOG, "gameStateChanged 렌더러로 전송함");
                }
            }
        )
        .subscribe((status) => {
            console.log(LOG, "채널 subscribe status:", status);
            if (status === "SUBSCRIBED") {
                console.log(LOG, "✅ Realtime 구독 성공!");
            } else if (status === "TIMED_OUT") {
                console.error(LOG, "❌ Realtime 구독 타임아웃 - Supabase Replication 확인 필요");
            } else if (status === "CHANNEL_ERROR") {
                console.error(LOG, "❌ Realtime 채널 에러");
            }
        });

    return true;
});
