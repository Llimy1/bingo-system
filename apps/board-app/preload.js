const { contextBridge } = require("electron");
const { createClient } = require("@supabase/supabase-js");

const LOG = "[board-preload]";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

console.log(LOG, "로드, SUPABASE_URL 있음:", !!SUPABASE_URL);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(LOG, "SUPABASE ENV 없음");
    throw new Error("❌ SUPABASE ENV missing");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log(LOG, "Supabase 클라이언트 생성됨");

contextBridge.exposeInMainWorld("api", {
    async getGameState() {
        console.log(LOG, "getGameState 호출");
        const { data, error } = await supabase.from("game_state").select("*").limit(1).maybeSingle();
        if (error) console.error(LOG, "getGameState 에러:", error);
        console.log(LOG, "getGameState 결과:", data?.status);
        return data;
    },

    async getDrawnNumbers() {
        console.log(LOG, "getDrawnNumbers 호출");
        const { data, error } = await supabase.from("drawn_numbers").select("number").order("drawn_at");
        if (error) console.error(LOG, "getDrawnNumbers 에러:", error);
        console.log(LOG, "getDrawnNumbers 결과 개수:", data?.length || 0);
        return data || [];
    },

    async getInitial() {
        console.log(LOG, "getInitial 호출");
        const { data: game, error: gameErr } = await supabase.from("game_state").select("*").limit(1).maybeSingle();
        if (gameErr) console.error(LOG, "getInitial game_state 에러:", gameErr);
        const { data: numbers, error: numErr } = await supabase.from("drawn_numbers").select("number").order("drawn_at");
        if (numErr) console.error(LOG, "getInitial drawn_numbers 에러:", numErr);
        const { data: lines } = await supabase.from("bingo_lines").select("*");
        console.log(LOG, "getInitial 결과 game:", game?.status, "numbers:", numbers?.length, "lines:", lines?.length);
        return { game, numbers: numbers || [], lines: lines || [] };
    },

    onGameState(cb) {
        console.log(LOG, "onGameState 구독 등록");
        supabase
            .channel("board-game")
            .on("postgres_changes", { event: "*", schema: "public", table: "game_state" }, (payload) => {
                const row = payload?.new ?? payload?.old;
                console.log(LOG, "Realtime game_state 수신:", row?.status);
                if (row) cb(row);
            })
            .subscribe((status) => console.log(LOG, "board-game channel subscribe status:", status));
    },

    onDrawnNumber(cb) {
        console.log(LOG, "onDrawnNumber 구독 등록");
        supabase
            .channel("board-drawn")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "drawn_numbers" }, (payload) => {
                console.log(LOG, "Realtime drawn_numbers 수신:", payload?.new?.number);
                if (payload?.new) cb(payload.new);
            })
            .subscribe((status) => console.log(LOG, "board-drawn channel subscribe status:", status));
    },

    onBingoLine(cb) {
        console.log(LOG, "onBingoLine 구독 등록");
        supabase
            .channel("board-bingo")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "bingo_lines" }, (payload) => {
                console.log(LOG, "Realtime bingo_lines 수신:", payload?.new);
                if (payload?.new) cb(payload.new);
            })
            .subscribe((status) => console.log(LOG, "board-bingo channel subscribe status:", status));
    }
});
console.log(LOG, "api 노출 완료");
