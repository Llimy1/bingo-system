// ========================================
// Board Renderer - Polling 버전
// ========================================

const LOG = "[board-renderer-polling]";
console.log(LOG, "스크립트 로드 시작");

// API 체크
if (!window.api) {
    console.error(LOG, "window.api 없음!");
    document.body.innerHTML = "<h1 style='color:red; padding:20px;'>API 연결 실패</h1>";
    throw new Error("window.api 없음");
}

console.log(LOG, "window.api 확인 완료");

// DOM 요소
const boardEl = document.getElementById("bingo-board");
const statusText = document.getElementById("status-text");
const bingoCountEl = document.getElementById("bingo-count");

console.log(LOG, "DOM 요소:", {
    boardEl: !!boardEl,
    statusText: !!statusText,
    bingoCountEl: !!bingoCountEl
});

if (!boardEl || !statusText) {
    alert("필수 DOM 요소를 찾을 수 없습니다!");
    throw new Error("필수 DOM 요소 누락");
}

// 상태
let cells = [];
let numberToCell = new Map();
let markedNumbers = new Set();
let lastGameStatus = "ready";
let lastDrawnCount = 0;

// 빙고판 생성 (5x10)
function initBoard() {
    console.log(LOG, "========== initBoard() 시작 ==========");
    boardEl.innerHTML = "";
    cells = [];
    numberToCell.clear();
    markedNumbers.clear();

    // 1~50 랜덤 섞기
    const nums = Array.from({ length: 50 }, (_, i) => i + 1);
    for (let i = nums.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nums[i], nums[j]] = [nums[j], nums[i]];
    }

    // 5x10 그리드 생성
    nums.forEach(n => {
        const div = document.createElement("div");
        div.className = "cell";
        div.textContent = n;
        boardEl.appendChild(div);
        cells.push(div);
        numberToCell.set(n, div);
    });

    console.log(LOG, "빙고판 생성 완료, 50개 셀");
    console.log(LOG, "========== initBoard() 완료 ==========");
}

// 번호 마킹
function markNumber(n) {
    if (markedNumbers.has(n)) {
        console.log(LOG, "이미 마킹된 번호:", n);
        return;
    }

    const cell = numberToCell.get(n);
    if (cell) {
        cell.classList.add("marked");
        markedNumbers.add(n);
        console.log(LOG, "✅ 번호 마킹:", n, "/ 총 마킹:", markedNumbers.size);
    } else {
        console.log(LOG, "❌ 번호를 찾을 수 없음:", n);
    }
}

// 상태 표시
function showReady() {
    console.log(LOG, "showReady()");
    statusText.textContent = "준비 중...";
}

function showPlaying() {
    console.log(LOG, "showPlaying()");
    statusText.textContent = "게임 진행 중";
}

// 보드 리셋
function resetBoard() {
    console.log(LOG, "========== resetBoard() 시작 ==========");
    initBoard(); // 보드 재생성
    showReady();
    if (bingoCountEl) bingoCountEl.textContent = "0";
    console.log(LOG, "========== resetBoard() 완료 ==========");
}

// 폴링: 게임 상태 확인
async function pollGameState() {
    try {
        const game = await window.api.getGameState();
        
        // 상태 변경 감지
        if (game && game.status !== lastGameStatus) {
            console.log(LOG, "📡 상태 변경 감지:", lastGameStatus, "→", game.status);
            lastGameStatus = game.status;
            
            if (game.status === "ready") {
                console.log(LOG, "→ resetBoard() 호출");
                resetBoard();
                lastDrawnCount = 0;
            } else if (game.status === "playing") {
                console.log(LOG, "→ showPlaying() 호출");
                showPlaying();
            }
        }
    } catch (err) {
        console.error(LOG, "pollGameState 에러:", err);
    }
}

// 폴링: 추첨 번호 확인
async function pollDrawnNumbers() {
    try {
        const rows = await window.api.getDrawnNumbers();
        const currentCount = rows?.length || 0;
        
        // 새로운 번호가 추가되었는지 확인
        if (currentCount > lastDrawnCount) {
            console.log(LOG, "📡 새 번호 감지:", lastDrawnCount, "→", currentCount);
            
            // 새로 추가된 번호들만 마킹
            const newNumbers = rows.slice(lastDrawnCount);
            newNumbers.forEach(row => {
                const num = row?.number;
                if (num) markNumber(num);
            });
            
            lastDrawnCount = currentCount;
        }
    } catch (err) {
        console.error(LOG, "pollDrawnNumbers 에러:", err);
    }
}

// 초기화
async function init() {
    console.log(LOG, "init() 시작");
    
    try {
        // 빙고판 생성
        initBoard();
        
        // 현재 게임 상태 가져오기
        const game = await window.api.getGameState();
        console.log(LOG, "getGameState 완료:", game);
        
        // 이미 뽑힌 번호들 가져오기
        const rows = await window.api.getDrawnNumbers();
        console.log(LOG, "getDrawnNumbers 완료, 개수:", rows?.length || 0);
        
        // 상태 설정
        if (game?.status === "playing") {
            console.log(LOG, "이미 playing 상태");
            lastGameStatus = "playing";
            showPlaying();
        } else {
            console.log(LOG, "ready 상태");
            lastGameStatus = "ready";
            showReady();
        }
        
        // 기존 번호들 마킹
        if (rows && rows.length > 0) {
            console.log(LOG, "기존 번호 마킹 시작");
            rows.forEach(row => {
                const num = row?.number;
                if (num) markNumber(num);
            });
            lastDrawnCount = rows.length;
        }
        
        // 폴링 시작 (1초마다)
        setInterval(() => {
            pollGameState();
            pollDrawnNumbers();
        }, 1000);
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
