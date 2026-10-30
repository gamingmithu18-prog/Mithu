const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`
  <h2>LAKSHAN-MD PAIR SITE</h2>
  <input id="num" placeholder="947xxxxxxxx" style="padding:10px;width:200px">
  <button onclick="getCode()" style="padding:10px">GET CODE</button>
  <p id="out"></p>
  <script>
  async function getCode(){
    const number = document.getElementById('num').value;
    document.getElementById('out').innerText = 'Generating...';
    const r = await fetch('/code?number='+number);
    const d = await r.json();
    document.getElementById('out').innerText = d.code || d.error;
  }
  </script>
  `);
});

app.get('/code', async (req, res) => {
  let num = req.query.number?.replace(/[^0-9]/g,'');
  if(!num) return res.json({error:'Enter number'});
  
  async function startPair() {
    const { state, saveCreds } = await useMultiFileAuthState('./tmp_'+Date.now());
    const sock = makeWASocket({
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      auth: state,
      browser: ['Ubuntu','Chrome','20.0']
    });

    if(!sock.authState.creds.registered) {
      await delay(1500);
      let code = await sock.requestPairingCode(num);
      res.json({code: code});
    }
    sock.ev.on('creds.update', saveCreds);
  }
  startPair();
});

// ---- MEKA THAMAI FIX EKA ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log('Pair server running on ' + PORT));
