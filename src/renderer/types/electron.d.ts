// Type definitions for Electron API
export interface ElectronAPI {
    getVersion: () => Promise<string>;
    getName: () => Promise<string>;
    minimizeWindow: () => Promise<void>;
    maximizeWindow: () => Promise<void>;
    closeWindow: () => Promise<void>;
    setWindowPosition: (x: number, y: number) => Promise<boolean>;
    getWindowPosition: () => Promise<[number, number]>;
    isWindowMaximized: () => Promise<boolean>;
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}