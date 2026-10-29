const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static('public'));

let sock;

// Pair Code ganna API eka
app.get('/code', async (req, res) => {
    let number = req.query.number;
    if (!number) return res.json({ error: "Number eka nane" });
    number = number.replace(/[^0-9]/g, '');

    try {
        const { state, saveCreds } = await useMultiFileAuthState('./auth/' + number);
        
        sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino().child({ level: "fatal" }))
            },
            printQRInTerminal: false,
            logger: pino({ level: "silent" }),
            browser: ["MITHU-BOT", "Chrome", "1.0.0"]
        });

        sock.ev.on('creds.update', saveCreds);

        if (!sock.authState.creds.registered) {
            let code = await sock.requestPairingCode(number);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            res.json({ code: code });
        } else {
            res.json({ error: "Already paired" });
        }

    } catch (e) {
        res.json({ error: e.message });
    }
});

// Site eka pennana eka
app.get('/', (req, res) => {
    res.send(`
    <html>
    <head><title>MITHU PAIR</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>body{background:#111;color:#fff;text-align:center;font-family:sans-serif;padding-top:50px}input{padding:12px;width:250px;border-radius:8px;border:none}button{padding:12px 20px;background:#25D366;border:none;border-radius:8px;margin-top:10px;font-weight:bold}</style>
    </head>
    <body>
    <h2>MITHU-MD PAIR SITE</h2>
    <p>Number eka danna (9476...)</p>
    <input id="num" placeholder="9476xxxxxxx"><br>
    <button onclick="getCode()">GET CODE</button>
    <h1 id="code"></h1>
    <script>
    async function getCode(){
        let n=document.getElementById('num').value;
        document.getElementById('code').innerText='Wait...';
        let res=await fetch('/code?number='+n);
        let data=await res.json();
        document.getElementById('code').innerText=data.code || data.error;
    }
    </script>
    </body>
    </html>
    `);
});

app.listen(3000, () => console.log('Pair server running on 3000'));
