// ========================================
// Draw Renderer - Realtime 버전
// ========================================

const LOG = "[draw-renderer]";
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
let availableNumbers = [];
let drawnNumbers = [];

// DOM 요소
const statusText = document.getElementById("status-text");
const drawnNumberEl = document.getElementById("drawn-number");
const drawButton = document.getElementById("draw-button");
const historyList = document.getElementById("history-list");

console.log(LOG, "DOM 요소:", {
    statusText: !!statusText,
    drawnNumberEl: !!drawnNumberEl,
    drawButton: !!drawButton,
    historyList: !!historyList
});

// UI 업데이트
function updateUI() {
    historyList.innerHTML = "";
    drawnNumbers.forEach(n => {
        const el = document.createElement("div");
        el.textContent = n;
        el.className = "history-number";
        historyList.appendChild(el);
    });

    if (gameStatus === "playing") {
        statusText.textContent = `게임 진행 중 (남은 번호: ${availableNumbers.length}개)`;
    } else {
        statusText.textContent = "준비 중...";
    }
}

// 게임 시작
function startGame() {
    console.log(LOG, "startGame() 호출");
    gameStatus = "playing";
    drawButton.disabled = false;
    availableNumbers = Array.from({ length: 50 }, (_, i) => i + 1).filter(
        n => !drawnNumbers.includes(n)
    );
    updateUI();
}

// 게임 리셋
function resetAll() {
    console.log(LOG, "========== resetAll() 시작 ==========");
    gameStatus = "ready";
    drawnNumbers = [];
    availableNumbers = Array.from({ length: 50 }, (_, i) => i + 1);
    drawnNumberEl.textContent = "-";
    drawnNumberEl.style.transform = "scale(1)";
    historyList.innerHTML = "";
    drawButton.disabled = true;
    statusText.textContent = "준비 중...";
    console.log(LOG, "========== resetAll() 완료 ==========");
}

// 번호 애니메이션
function animateNumber(n) {
    drawnNumberEl.style.transform = "scale(0)";
    setTimeout(() => {
        drawnNumberEl.textContent = n;
        drawnNumberEl.style.transform = "scale(1.2)";
        setTimeout(() => {
            drawnNumberEl.style.transform = "scale(1)";
        }, 200);
    }, 100);
}

// 번호 뽑기 버튼
drawButton.addEventListener("click", async () => {
    console.log(LOG, "번호 뽑기 버튼 클릭! gameStatus=", gameStatus);
    
    if (gameStatus !== "playing") {
        console.log(LOG, "게임 진행 중이 아니므로 무시");
        return;
    }
    
    if (availableNumbers.length === 0) {
        alert("모든 번호가 추첨되었습니다!");
        return;
    }

    try {
        const idx = Math.floor(Math.random() * availableNumbers.length);
        const number = availableNumbers[idx];
        console.log(LOG, "선택된 번호:", number);

        await window.api.insertNumber(number);
        console.log(LOG, "insertNumber 완료");

        availableNumbers.splice(idx, 1);
        drawnNumbers.push(number);

        animateNumber(number);
        updateUI();
        
        console.log(LOG, "남은 번호:", availableNumbers.length);
    } catch (err) {
        console.error(LOG, "번호 뽑기 에러:", err);
        alert("번호 뽑기 실패: " + err.message);
    }
});

// Realtime 구독 - game_state 변경 감지
window.api.onGameState((game) => {
    console.log(LOG, "🔴 Realtime onGameState 수신:", game);
    
    if (!game) {
        console.log(LOG, "game이 null/undefined, 무시");
        return;
    }
    
    console.log(LOG, "game.status =", game.status);
    
    if (game.status === "playing") {
        console.log(LOG, "→ startGame() 호출");
        startGame();
    } else if (game.status === "ready") {
        console.log(LOG, "→ resetAll() 호출");
        resetAll();
    }
});

// 초기화
async function init() {
    console.log(LOG, "init() 시작");
    
    try {
        const game = await window.api.getGameState();
        console.log(LOG, "getGameState 완료:", game);
        
        const rows = await window.api.getDrawnNumbers();
        console.log(LOG, "getDrawnNumbers 완료, 개수:", rows?.length || 0);
        
        drawnNumbers = Array.isArray(rows) ? rows.map(r => r.number) : [];
        console.log(LOG, "drawnNumbers:", drawnNumbers);
        
        if (game?.status === "playing") {
            console.log(LOG, "이미 playing 상태 → startGame()");
            startGame();
        } else {
            console.log(LOG, "ready 상태 → resetAll()");
            resetAll();
        }
        
        console.log(LOG, "init() 완료");
    } catch (err) {
        console.error(LOG, "init() 에러:", err);
        statusText.textContent = "초기화 실패 - 콘솔 확인";
        alert("초기화 실패: " + err.message);
    }
}

// 앱 시작
console.log(LOG, "init() 호출");
init();

console.log(LOG, "스크립트 로드 완료");

