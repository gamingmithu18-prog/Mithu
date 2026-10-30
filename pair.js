const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

const app = express();

app.get('/', (req, res) => {
  res.send(`
  <html>
  <head><title>LAKSHAN-MD Pair</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
  <body style="font-family:sans-serif;text-align:center;padding:20px;background:#111;color:white">
  <h2>LAKSHAN-MD PAIR 🔥</h2>
  <input id="num" placeholder="947xxxxxxxx" style="padding:12px;width:80%;max-width:300px;border-radius:8px;border:none">
  <br><br>
  <button onclick="getCode()" style="padding:12px 25px;background:#25D366;color:white;border:none;border-radius:8px;font-weight:bold">GET PAIR CODE</button>
  <h2 id="out" style="margin-top:20px;letter-spacing:3px"></h2>
  <script>
  async function getCode(){
    const number = document.getElementById('num').value;
    if(!number){ alert('Number eka danna!'); return; }
    document.getElementById('out').innerText = 'Generating... Please Wait...';
    try{
      const r = await fetch('/code?number='+number);
      const d = await r.json();
      document.getElementById('out').innerText = d.code || d.error || 'Error';
    } catch(e){ document.getElementById('out').innerText = 'Error - Try Again'; }
  }
  </script>
  </body>
  </html>
  `);
});

app.get('/code', async (req, res) => {
  let num = req.query.number?.replace(/[^0-9]/g,'');
  if(!num) return res.json({error:'Number eka hariyata danna!'});
  if(num.length < 10) return res.json({error:'Number eka digatamadi!'});

  let dir = './tmp_' + Date.now();
  try {
    const { state, saveCreds } = await useMultiFileAuthState(dir);
    const sock = makeWASocket({
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      auth: state,
      browser: ['Chrome','Windows','10']
    });

    sock.ev.on('creds.update', saveCreds);

    if(!sock.authState.creds.registered) {
      await delay(2000);
      let code = await sock.requestPairingCode(num);
      if(!res.headersSent) res.json({code: code});
      await delay(10000);
      try{ fs.rmSync(dir, {recursive:true, force:true}); } catch(e){}
      try{ sock.end(); } catch(e){}
    }
  } catch(e) {
    console.log('Pair Error:', e);
    if(!res.headersSent) res.json({error:'Failed to get code. Try again! ' + e.message});
    try{ fs.rmSync(dir, {recursive:true, force:true}); } catch(err){}
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log('Pair server running on ' + PORT));
