import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { isDev, platform } from "./utils";

class Main {
    private mainWindow: BrowserWindow | null = null;

    public init(): void {
        app.whenReady().then(() => {
        this.createWindow();
        
        app.on("activate", () => {
            // On macOS it"s common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (BrowserWindow.getAllWindows().length === 0) this.createWindow();
        });
        });

        app.on("window-all-closed", () => {
        if (platform !== "darwin") {
            app.quit();
        }
        });

        this.setupIpcHandlers();
    }

    private createWindow(): void {
        const preload = path.join(__dirname, "preload.js");
        
        // Create the browser window
        this.mainWindow = new BrowserWindow({
            height: 900,
            width: 1200,
            webPreferences: {
                preload,
                nodeIntegration: false,
                contextIsolation: true,
            },
            show: false,
            frame: false,
            titleBarStyle: "hidden",
            autoHideMenuBar: true,
            resizable: true,
            movable: false,
            minimizable: true,
            maximizable: true,
            closable: true
        });
        this.mainWindow.removeMenu();
        this.mainWindow.webContents.openDevTools();

        // Load the appropriate URL
        if (isDev) {
        this.mainWindow.loadURL("http://127.0.0.1:5173");
            this.mainWindow.webContents.openDevTools();
        } else {
            this.mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
        }

        this.mainWindow.on("ready-to-show", () => {
            this.mainWindow?.show();
        });

        this.mainWindow.on("closed", () => {
            this.mainWindow = null;
        });

        this.mainWindow.on("resize", () => {
            // re-render main window on resize
            this.mainWindow?.reload();
        });
    }

    private setupIpcHandlers(): void {
        // Example IPC handlers - expand these as needed
        ipcMain.handle("app:getVersion", () => {
            return app.getVersion();
        });

        ipcMain.handle("app:getName", () => {
            return app.getName();
        });

        ipcMain.handle("window:minimize", () => {
            this.mainWindow?.minimize();
        });

        ipcMain.handle("window:maximize", () => {
            if (this.mainWindow?.isMaximized()) {
                this.mainWindow.unmaximize();
            } else {
                this.mainWindow?.maximize();
            }
        });

        ipcMain.handle("window:setPosition", (_, x: number, y: number) => {
            if (this.mainWindow && !this.mainWindow.isMaximized()) {
                this.mainWindow.setPosition(x, y);
            }
            return true;
        });

        ipcMain.handle("window:getPosition", () => {
            if (this.mainWindow) {
                return this.mainWindow.getPosition();
            }
            return [0, 0];
        });

        ipcMain.handle("window:close", () => {
            this.mainWindow?.close();
        });


        ipcMain.handle("window:isMaximized", () => {
            return this.mainWindow?.isMaximized() || false;
        });
    }
}

// Init Electron main
const main = new Main();
main.init();