const { contextBridge, ipcRenderer } = require("electron");

const LOG = "[draw-preload]";
console.log(LOG, "로드");

contextBridge.exposeInMainWorld("api", {
    async getGameState() {
        console.log(LOG, "getGameState invoke");
        return await ipcRenderer.invoke("getGameState");
    },

    async getDrawnNumbers() {
        console.log(LOG, "getDrawnNumbers invoke");
        return await ipcRenderer.invoke("getDrawnNumbers");
    },

    async insertNumber(number) {
        console.log(LOG, "insertNumber invoke", number);
        return await ipcRenderer.invoke("insertNumber", number);
    },

    async subscribeGameState() {
        console.log(LOG, "subscribeGameState invoke");
        return await ipcRenderer.invoke("subscribeGameState");
    },

    onGameState(cb) {
        console.log(LOG, "onGameState 리스너 등록");
        ipcRenderer.on("gameStateChanged", (event, data) => {
            console.log(LOG, "gameStateChanged 수신:", data?.status);
            cb(data);
        });
    }
});
console.log(LOG, "api 노출 완료");
