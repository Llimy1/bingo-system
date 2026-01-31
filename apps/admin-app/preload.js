const { contextBridge } = require("electron");
const { createClient } = require("@supabase/supabase-js");

const LOG = "[admin-preload]";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

console.log(LOG, "로드, SUPABASE_URL 있음:", !!SUPABASE_URL);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(LOG, "Supabase env 없음");
    throw new Error("❌ Supabase env missing");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log(LOG, "Supabase 클라이언트 생성됨");

contextBridge.exposeInMainWorld("api", {
    async getGameState() {
        console.log(LOG, "getGameState 호출");
        const { data, error } = await supabase.from("game_state").select("*").limit(1).maybeSingle();
        if (error) console.error(LOG, "getGameState 에러:", error);
        console.log(LOG, "getGameState 결과:", data ? { status: data.status } : null);
        return data;
    },

    async getInitial() {
        console.log(LOG, "getInitial 호출");
        const { data: game } = await supabase.from("game_state").select("*").limit(1).maybeSingle();
        const { data: numbers } = await supabase.from("drawn_numbers").select("number").order("drawn_at");
        const { count: bingoCount } = await supabase.from("bingo_lines").select("*", { count: "exact", head: true });
        console.log(LOG, "getInitial 결과 game:", game?.status, "numbers:", numbers?.length, "bingoCount:", bingoCount ?? 0);
        return { game, numbers: numbers || [], bingoCount: bingoCount ?? 0 };
    },

    async setGameStatus(status) {
        console.log(LOG, "setGameStatus 호출 status=", status);
        const { data: row } = await supabase.from("game_state").select("id").limit(1).maybeSingle();
        if (!row) {
            console.log(LOG, "game_state 행 없음 → insert");
            const { error: insertErr } = await supabase.from("game_state").insert({ status }).select("id").single();
            if (insertErr) {
                console.error(LOG, "setGameStatus insert 에러:", insertErr);
                throw insertErr;
            }
            console.log(LOG, "setGameStatus insert 완료");
            return;
        }
        const { error } = await supabase
            .from("game_state")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", row.id);
        if (error) {
            console.error(LOG, "setGameStatus update 에러:", error);
            throw error;
        }
        console.log(LOG, "setGameStatus update 완료");
    },

    async resetGame() {
        console.log(LOG, "resetGame 호출");
        const { error: delNum } = await supabase.from("drawn_numbers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (delNum) console.error(LOG, "resetGame drawn_numbers 에러:", delNum);
        const { error: delLine } = await supabase.from("bingo_lines").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (delLine) console.error(LOG, "resetGame bingo_lines 에러:", delLine);
        console.log(LOG, "resetGame 완료");
    },

    onGameState(cb) {
        console.log(LOG, "onGameState 구독 등록");
        supabase
            .channel("admin-game")
            .on("postgres_changes", { event: "*", schema: "public", table: "game_state" }, (payload) => {
                const row = payload?.new ?? payload?.old;
                console.log(LOG, "Realtime game_state 수신:", row?.status);
                if (row) cb(row);
            })
            .subscribe((status) => console.log(LOG, "admin-game channel subscribe status:", status));
    },

    onDrawnNumber(cb) {
        console.log(LOG, "onDrawnNumber 구독 등록");
        supabase
            .channel("admin-drawn")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "drawn_numbers" }, (payload) => {
                console.log(LOG, "Realtime drawn_numbers 수신:", payload?.new?.number);
                if (payload?.new) cb(payload.new);
            })
            .subscribe((status) => console.log(LOG, "admin-drawn channel subscribe status:", status));
    },

    onBingoLine(cb) {
        console.log(LOG, "onBingoLine 구독 등록");
        supabase
            .channel("admin-bingo")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "bingo_lines" }, (payload) => {
                console.log(LOG, "Realtime bingo_lines 수신:", payload?.new);
                if (payload?.new) cb(payload.new);
            })
            .subscribe((status) => console.log(LOG, "admin-bingo channel subscribe status:", status));
    }
});

console.log(LOG, "api 노출 완료");
