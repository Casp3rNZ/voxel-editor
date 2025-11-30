import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// API interface
export interface ElectronAPI {
    // App methods
    getVersion: () => Promise<string>;
    getName: () => Promise<string>;

    // Window controls
    minimizeWindow: () => Promise<void>;
    maximizeWindow: () => Promise<void>;
    closeWindow: () => Promise<void>;
    setWindowPosition: (x: number, y: number) => Promise<boolean>;
    getWindowPosition: () => Promise<[number, number]>;

}

// API definition
const electronAPI: ElectronAPI = {
    // App methods
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getName: () => ipcRenderer.invoke('app:getName'),
    // Window controls
    minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
    maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
    closeWindow: () => ipcRenderer.invoke('window:close'),
    setWindowPosition: (x: number, y: number) => ipcRenderer.invoke('window:setPosition', x, y),
    getWindowPosition: () => ipcRenderer.invoke('window:getPosition'),
    
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for the global window object
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}