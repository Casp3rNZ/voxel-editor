// Type definitions for Electron API
export interface ElectronAPI {
    getVersion: () => Promise<string>;
    getName: () => Promise<string>;
    minimizeWindow: () => Promise<void>;
    maximizeWindow: () => Promise<void>;
    closeWindow: () => Promise<void>;
    setWindowPosition: (x: number, y: number) => Promise<boolean>;
    getWindowPosition: () => Promise<[number, number]>;
    readFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
    writeFile: (filePath: string, data: string) => Promise<{ success: boolean; error?: string }>;
    on: (channel: string, callback: (...args: any[]) => void) => void;
    removeListener: (channel: string, callback: (...args: any[]) => void) => void;
    removeAllListeners: (channel: string) => void;
    voxelEditor: {
        saveProject: (projectData: any) => Promise<{ success: boolean; error?: string }>;
        loadProject: (filePath: string) => Promise<{ success: boolean; data?: any; error?: string }>;
        exportModel: (modelData: any, format: string) => Promise<{ success: boolean; error?: string }>;
    };
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}