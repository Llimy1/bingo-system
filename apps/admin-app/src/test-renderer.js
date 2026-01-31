// 테스트용 간단한 renderer
console.log("=== TEST RENDERER 시작 ===");

// DOM 확인
const startButton = document.getElementById("start-button");
const resetButton = document.getElementById("reset-button");

console.log("startButton:", startButton);
console.log("resetButton:", resetButton);

if (!startButton || !resetButton) {
    alert("버튼을 찾을 수 없습니다!");
} else {
    alert("버튼 찾기 성공!");
    
    startButton.onclick = () => {
        console.log("게임 시작 버튼 클릭!");
        alert("게임 시작 클릭됨!");
    };
    
    resetButton.onclick = () => {
        console.log("리셋 버튼 클릭!");
        alert("리셋 클릭됨!");
    };
}

console.log("=== TEST RENDERER 완료 ===");
