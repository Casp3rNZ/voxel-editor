"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const utils_1 = require("./utils");
class Main {
    constructor() {
        this.mainWindow = null;
    }
    init() {
        electron_1.app.whenReady().then(() => {
            this.createWindow();
            electron_1.app.on("activate", () => {
                // On macOS it"s common to re-create a window in the app when the
                // dock icon is clicked and there are no other windows open.
                if (electron_1.BrowserWindow.getAllWindows().length === 0)
                    this.createWindow();
            });
        });
        electron_1.app.on("window-all-closed", () => {
            if (utils_1.platform !== "darwin") {
                electron_1.app.quit();
            }
        });
        this.setupIpcHandlers();
    }
    createWindow() {
        const preload = path.join(__dirname, "preload.js");
        // Create the browser window
        this.mainWindow = new electron_1.BrowserWindow({
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
        if (utils_1.isDev) {
            this.mainWindow.loadURL("http://127.0.0.1:5173");
            this.mainWindow.webContents.openDevTools();
        }
        else {
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
    setupIpcHandlers() {
        // Example IPC handlers - expand these as needed
        electron_1.ipcMain.handle("app:getVersion", () => {
            return electron_1.app.getVersion();
        });
        electron_1.ipcMain.handle("app:getName", () => {
            return electron_1.app.getName();
        });
        electron_1.ipcMain.handle("window:minimize", () => {
            this.mainWindow?.minimize();
        });
        electron_1.ipcMain.handle("window:maximize", () => {
            if (this.mainWindow?.isMaximized()) {
                this.mainWindow.unmaximize();
            }
            else {
                this.mainWindow?.maximize();
            }
        });
        electron_1.ipcMain.handle("window:setPosition", (_, x, y) => {
            if (this.mainWindow && !this.mainWindow.isMaximized()) {
                this.mainWindow.setPosition(x, y);
            }
            return true;
        });
        electron_1.ipcMain.handle("window:getPosition", () => {
            if (this.mainWindow) {
                return this.mainWindow.getPosition();
            }
            return [0, 0];
        });
        electron_1.ipcMain.handle("window:close", () => {
            this.mainWindow?.close();
        });
        electron_1.ipcMain.handle("window:isMaximized", () => {
            return this.mainWindow?.isMaximized() || false;
        });
    }
}
// Init Electron main
const main = new Main();
main.init();
