const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const MY_NUMBER = "94741448572";

app.use(express.json());

let sock;
let pairCodeData = { code: null, status: 'waiting' };

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ["MITHU-MUSIC", "Chrome", "1.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log('✅ Bot Connected!');
            pairCodeData.status = 'connected';
        }
        if (connection === 'close') {
            console.log('Connection closed, reconnecting...');
            startBot();
        }
    });
}

app.get('/', (req, res) => {
    res.send(`
    <html>
    <head><title>MITHU MUSIC PAIR</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
    <body style="background:#0f0f0f;color:white;font-family:sans-serif;text-align:center;padding-top:50px">
        <h1>🔒 MITHU MUSIC</h1>
        <p>Locked to: <b>${MY_NUMBER}</b></p>
        <h2 id="code" style="font-size:40px;letter-spacing:5px;margin:20px;color:#00ff88">Click Button</h2>
        <button onclick="getCode()" style="padding:15px 30px;font-size:18px;background:#00ff88;border:none;border-radius:10px;font-weight:bold">GET MY PAIR CODE</button>
        <p id="status"></p>
        <script>
            async function getCode(){
                document.getElementById('code').innerText='Generating...';
                const r = await fetch('/pair');
                const d = await r.json();
                if(d.code){ document.getElementById('code').innerText=d.code; document.getElementById('status').innerText='WhatsApp > Linked Devices > Link with phone number > paste this code'; }
                else { document.getElementById('code').innerText='Error: '+d.error; }
            }
        </script>
    </body>
    </html>
    `);
});

app.get('/pair', async (req, res) => {
    try {
        if (!sock) return res.json({ error: 'Bot starting, wait 5 sec and retry' });
        if (sock.authState.creds.registered) {
            return res.json({ error: 'Already paired! Delete auth_info folder to re-pair' });
        }
        let code = await sock.requestPairingCode(MY_NUMBER);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        pairCodeData.code = code;
        console.log('Pair Code:', code);
        res.json({ code: code });
    } catch (e) {
        console.log('Pair error:', e);
        res.json({ error: e.message || 'Failed to get code' });
    }
});

// OMINI HOST FIX - 0.0.0.0 bind
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔒 Locked bot running on ${PORT} for ${MY_NUMBER}`);
    startBot();
});
