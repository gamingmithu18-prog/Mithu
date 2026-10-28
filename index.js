const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const MY_NUMBER = "94741448572"; // Ube number eka - lock karala thiyenne

app.use(express.json());

let sock;

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ["MITHU-MUSIC", "Chrome", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'open') {
            console.log('✅ Bot Connected! Session Saved!');
        }
        
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            console.log('Connection closed, Code:', statusCode, 'Reason:', lastDisconnect?.error?.message);

            // 401 = Logged out, auth corrupt
            if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                console.log('❌ Logged out! Deleting auth_info...');
                try { 
                    if(fs.existsSync('./auth_info')){
                        fs.rmSync('./auth_info', { recursive: true, force: true });
                        console.log('auth_info deleted, restart to get new pair code');
                    }
                } catch(e){ console.log('delete error', e)
