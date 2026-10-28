const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const pino = require('pino');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// public folder eka hadanawa
if (!fs.existsSync('public')) fs.mkdirSync('public');

app.use(express.static('public'));

let sock;
let qrString = null;

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    sock = makeWASocket({ 
        auth: state, 
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ["Mithu Bot", "Chrome", "1.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr, lastDisconnect } = update;
        if(qr) {
            qrString = qr;
            console.log("QR Ready!");
        }
        if(connection === 'open') {
            console.log("✅ Bot Connected!");
            qrString = null;
        }
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if(shouldReconnect) startBot();
        }
    });
}

// QR Page
app.get('/qr', async (req,res) => {
    if(!qrString) return res.send("<h2>✅ Connected! or wait for QR... refresh</h2>");
    const qrImage = await QRCode.toDataURL(qrString);
    res.send(`<center><img src="${qrImage}"><br><h3>WhatsApp > Linked Devices > Link Device > Scan</h3></center>`);
});

// Send Song API
app.post('/send-song', async (req, res) => {
    try {
        const { channelId, title, image, mp3 } = req.body;
        if(!sock) return res.json({ error: "Bot not connected" });
        
        await sock.sendMessage(channelId, { 
            image: { url: image }, 
            caption: `🎵 *${title}*\n\n> Mithu Music Bot` 
        });
        await sock.sendMessage(channelId, { 
            audio: { url: mp3 }, 
            mimetype: 'audio/mpeg' 
        });
        res.json({ success: true });
    } catch(e) { 
        res.json({ error: e.message }); 
    }
});

// Home
app.get('/', (req,res) => {
    const file = path.join(__dirname, 'public', 'index.html');
    if(fs.existsSync(file)) return res.sendFile(file);
    res.send('<h2>Bot Running! Go to /qr for QR</h2>');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));
startBot();
