const { contextBridge } = require("electron");
const { createClient } = require("@supabase/supabase-js");

const LOG = "[draw-preload-direct]";
console.log(LOG, "로드");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

console.log(LOG, "SUPABASE_URL:", SUPABASE_URL);
console.log(LOG, "SUPABASE_ANON_KEY 길이:", SUPABASE_ANON_KEY?.length);

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

    async insertNumber(number) {
        console.log(LOG, "insertNumber 호출", number);
        const { error } = await supabase.from("drawn_numbers").insert({ number });
        if (error) {
            console.error(LOG, "insertNumber 에러:", error);
            throw error;
        }
        console.log(LOG, "insertNumber 완료");
    },

    onGameState(cb) {
        console.log(LOG, "onGameState 구독 등록");
        supabase
            .channel("draw-game-direct")
            .on("postgres_changes", { event: "*", schema: "public", table: "game_state" }, (payload) => {
                const row = payload?.new ?? payload?.old;
                console.log(LOG, "Realtime game_state 수신:", row?.status);
                if (row) cb(row);
            })
            .subscribe((status) => {
                console.log(LOG, "draw-game-direct channel subscribe status:", status);
                if (status === "SUBSCRIBED") {
                    console.log(LOG, "✅ Realtime 구독 성공!");
                } else if (status === "TIMED_OUT") {
                    console.error(LOG, "❌ Realtime 타임아웃");
                }
            });
    }
});

console.log(LOG, "api 노출 완료");
