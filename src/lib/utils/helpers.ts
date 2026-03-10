import { Capacitor } from '@capacitor/core';
import terminal from 'virtual:terminal';
export function log(...args: any[]) {
    if (Capacitor.getPlatform() === 'web') {
        console.log(...args);
    } else {
        terminal.log(...args);
    }
}
