import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.yuddhaa.ledgerit',
    appName: 'ledgerit',
    webDir: 'build',
    server: {
        // 1. Replace with YOUR IP address (keep port 5173)
        // url: 'http://10.228.111.34:5173', // airtel hotspot ip
        url: 'http://10.69.35.34:5173/',
        // url: 'http://192.168.29.94:5173', // home raj_5g wifi IP
        // 2. Allow http (since we don't have SSL on dev)
        cleartext: true
    },
};

export default config;
