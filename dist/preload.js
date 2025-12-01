"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// API definition
const electronAPI = {
    // App methods
    getVersion: () => electron_1.ipcRenderer.invoke('app:getVersion'),
    getName: () => electron_1.ipcRenderer.invoke('app:getName'),
    // Window controls
    minimizeWindow: () => electron_1.ipcRenderer.invoke('window:minimize'),
    maximizeWindow: () => electron_1.ipcRenderer.invoke('window:maximize'),
    closeWindow: () => electron_1.ipcRenderer.invoke('window:close'),
    setWindowPosition: (x, y) => electron_1.ipcRenderer.invoke('window:setPosition', x, y),
    getWindowPosition: () => electron_1.ipcRenderer.invoke('window:getPosition'),
    isWindowMaximized: () => electron_1.ipcRenderer.invoke('window:isMaximized'),
};
// Expose the API to the renderer process
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
