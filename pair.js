const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Google SEO + Beautiful UI
app.get('/', (req, res) => {
res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MITHU MUSIC BOT - Official Pair Site | WhatsApp Pair Code</title>
<meta name="description" content="MITHU MUSIC BOT Official Pair Site. Get WhatsApp Pair Code instantly. Fast, Secure, 24/7 Online. Sri Lanka's No.1 WhatsApp Bot.">
<meta name="keywords" content="mithu music bot, whatsapp bot pair, baileys pair code, sri lanka whatsapp bot">
<meta name="author" content="MITHU">
<style>
body{font-family:Arial;background:#0f0f0f;color:#fff;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}
.card{background:#1a1a1a;padding:30px;border-radius:15px;box-shadow:0 0 20px #00ff88;width:90%;max-width:400px;text-align:center;border:1px solid #00ff88}
h1{color:#00ff88} input{width:90%;padding:12px;margin:15px 0;border-radius:8px;border:none;outline:none}
button{background:#00ff88;color:#000;padding:12px 25px;border:none;border-radius:8px;font-weight:bold;cursor:pointer;width:100%}
button:hover{background:#00cc6a}
</style>
</head>
<body>
<div class="card">
<h1>🎵 MITHU MUSIC BOT</h1>
<p>Official Public Pair Site</p>
<form action="/pair">
<input type="text" name="number" placeholder="9477xxxxxxx (no +)" required>
<button type="submit">GET PAIR CODE</button>
</form>
<p style="font-size:12px;margin-top:20px;color:#888">© 2026 MITHU | Fast & Secure</p>
</div>
</body>
</html>
`);
});

app.get('/pair', async (req, res) => {
let num = (req.query.number || '').replace(/[^0-9]/g, '');
if(!num) return res.send('<h2>Number eka danna bro!</h2><a href="/">Back</a>');
if(!num.startsWith('94')) num = '94'+num.slice(-9);

try {
if(!fs.existsSync('./sessions')) fs.mkdirSync('./sessions');
const { state, saveCreds } = await useMultiFileAuthState('./sessions/'+num);
const sock = makeWASocket({
auth: state,
logger: pino({ level: 'silent' }),
browser: ['MITHU-MUSIC', 'Chrome', '1.0.0']
});
sock.ev.on('creds.update', saveCreds);
await delay(3000);
let code = await sock.requestPairingCode(num);
code = code?.match(/.{1,4}/g)?.join('-') || code;
res.send(`
<div style="background:#0f0f0f;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;font-family:Arial">
<div style="background:#1a1a1a;padding:30px;border-radius:15px;text-align:center;border:2px solid #00ff88">
<h2 style="color:#00ff88">YOUR PAIR CODE</h2>
<h1 style="letter-spacing:5px;font-size:32px">${code}</h1>
<p>WhatsApp > Linked Devices > Link with Phone Number</p>
<a href="/" style="color:#00ff88">Pair Another Number</a>
</div>
</div>
`);
} catch(e){
res.send('<h2>Error: '+e.message+'</h2><a href="/">Try Again</a>');
}
});

app.listen(PORT, () => console.log('MITHU BOT LIVE ON '+PORT));
