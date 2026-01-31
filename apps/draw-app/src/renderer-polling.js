// ========================================
// Draw Renderer - Polling 버전 (Realtime 대신)
// ========================================

const LOG = "[draw-renderer-polling]";
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
let lastGameStatus = "ready";

// DOM 요소
const statusText = document.getElementById("status-text");
const drawnNumberEl = document.getElementById("drawn-number");
const drawButton = document.getElementById("draw-button");
const historyList = document.getElementById("history-list");

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

// 폴링: 주기적으로 게임 상태 확인
async function pollGameState() {
    try {
        const game = await window.api.getGameState();
        
        if (game && game.status !== lastGameStatus) {
            console.log(LOG, "📡 상태 변경 감지:", lastGameStatus, "→", game.status);
            lastGameStatus = game.status;
            
            if (game.status === "playing") {
                console.log(LOG, "→ startGame() 호출");
                startGame();
            } else if (game.status === "ready") {
                console.log(LOG, "→ resetAll() 호출");
                resetAll();
            }
        }
    } catch (err) {
        console.error(LOG, "pollGameState 에러:", err);
    }
}

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
            lastGameStatus = "playing";
            startGame();
        } else {
            console.log(LOG, "ready 상태 → resetAll()");
            lastGameStatus = "ready";
            resetAll();
        }
        
        // Realtime 대신 폴링 시작 (1초마다)
        setInterval(pollGameState, 1000);
        console.log(LOG, "폴링 시작 (1초 간격)");
        
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
