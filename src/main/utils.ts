import { app } from 'electron';
import * as os from 'os';

export const isDev = !app.isPackaged;
export const platform = os.platform();