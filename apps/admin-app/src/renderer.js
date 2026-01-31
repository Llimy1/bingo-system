// ========================================
// Admin Renderer - 완전 새로 작성
// ========================================

const LOG = "[admin-renderer]";
console.log(LOG, "스크립트 로드 시작");

// API 체크
if (!window.api) {
    console.error(LOG, "window.api 없음!");
    document.body.innerHTML = "<h1 style='color:red; padding:20px;'>API 연결 실패</h1>";
    throw new Error("window.api 없음");
}

console.log(LOG, "window.api 확인 완료");

// 상태
let gameStatus = "ready";
let currentDrawnCount = 0;
let currentBingoCount = 0;

// DOM 요소
const gameStatusEl = document.getElementById("game-status");
const startButton = document.getElementById("start-button");
const resetButton = document.getElementById("reset-button");
const drawnCountEl = document.getElementById("drawn-count");
const bingoCountEl = document.getElementById("bingo-count");

console.log(LOG, "DOM 요소:", {
    gameStatusEl: !!gameStatusEl,
    startButton: !!startButton,
    resetButton: !!resetButton,
    drawnCountEl: !!drawnCountEl,
    bingoCountEl: !!bingoCountEl
});

if (!gameStatusEl || !startButton || !resetButton || !drawnCountEl || !bingoCountEl) {
    alert("필수 DOM 요소를 찾을 수 없습니다!");
    throw new Error("필수 DOM 요소 누락");
}

// UI 업데이트
function updateUI() {
    console.log(LOG, "updateUI 호출, status=", gameStatus);
    
    switch (gameStatus) {
        case "ready":
            gameStatusEl.textContent = "준비";
            gameStatusEl.className = "status-value ready";
            break;
        case "playing":
            gameStatusEl.textContent = "진행 중";
            gameStatusEl.className = "status-value playing";
            break;
        case "finished":
            gameStatusEl.textContent = "종료";
            gameStatusEl.className = "status-value finished";
            break;
    }
}

// 게임 시작 버튼
startButton.addEventListener("click", async () => {
    console.log(LOG, "게임 시작 버튼 클릭!");
    
    try {
        await window.api.setGameStatus("playing");
        console.log(LOG, "setGameStatus(playing) 완료");
        
        gameStatus = "playing";
        startButton.disabled = true;
        updateUI();
    } catch (err) {
        console.error(LOG, "게임 시작 에러:", err);
        alert("게임 시작 실패: " + err.message);
    }
});

// 리셋 버튼
resetButton.addEventListener("click", async () => {
    console.log(LOG, "리셋 버튼 클릭!");
    
    try {
        await window.api.setGameStatus("ready");
        await window.api.resetGame();
        console.log(LOG, "리셋 완료");
        
        gameStatus = "ready";
        startButton.disabled = false;
        currentDrawnCount = 0;
        currentBingoCount = 0;
        drawnCountEl.textContent = "0";
        bingoCountEl.textContent = "0";
        updateUI();
    } catch (err) {
        console.error(LOG, "리셋 에러:", err);
        alert("리셋 실패: " + err.message);
    }
});

// Realtime 구독
window.api.onGameState((game) => {
    console.log(LOG, "Realtime game_state 수신:", game);
    if (game) {
        gameStatus = game.status;
        startButton.disabled = gameStatus === "playing";
        updateUI();
    }
});

window.api.onDrawnNumber((row) => {
    console.log(LOG, "Realtime drawn_number 수신:", row);
    currentDrawnCount++;
    drawnCountEl.textContent = currentDrawnCount.toString();
});

window.api.onBingoLine((row) => {
    console.log(LOG, "Realtime bingo_line 수신:", row);
    currentBingoCount++;
    bingoCountEl.textContent = currentBingoCount.toString();
});

// 초기화
async function init() {
    console.log(LOG, "init() 시작");
    
    try {
        const result = await window.api.getInitial();
        console.log(LOG, "getInitial 결과:", result);
        
        const { game, numbers, bingoCount } = result;
        
        if (game) {
            gameStatus = game.status;
            startButton.disabled = gameStatus === "playing";
        }
        
        currentDrawnCount = (numbers || []).length;
        drawnCountEl.textContent = currentDrawnCount.toString();
        
        currentBingoCount = bingoCount || 0;
        bingoCountEl.textContent = currentBingoCount.toString();
        
        updateUI();
        console.log(LOG, "init() 완료");
    } catch (err) {
        console.error(LOG, "init() 에러:", err);
        alert("초기화 실패: " + err.message);
    }
}

// 앱 시작
console.log(LOG, "init() 호출");
init();

console.log(LOG, "스크립트 로드 완료");

