const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MITHU MUSIC BOT - Pair</title>
<style>
body{background:#0a0a0a;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:sans-serif}
.card{background:#111;border:2px solid #00ff88;border-radius:20px;padding:30px;width:90%;max-width:400px;text-align:center;box-shadow:0 0 30px #00ff8855}
h1{color:#00ff88;margin:0;font-size:32px}
p{color:#fff}
input{width:90%;padding:15px;border-radius:12px;border:none;margin:15px 0;font-size:18px}
button{width:95%;padding:15px;background:#00ff88;color:#000;font-weight:bold;border:none;border-radius:12px;font-size:18px;cursor:pointer}
#code{margin-top:20px;color:#00ff88;font-size:22px;font-weight:bold;word-break:break-all}
</style>
</head>
<body>
<div class="card">
<h1>🎵 MITHU MUSIC BOT</h1>
<p>Official Public Pair Site</p>
<input id="num" placeholder="9471xxxxxxx - 94 ekka" value="">
<button onclick="getCode()">GET PAIR CODE</button>
<div id="code"></div>
<p style="font-size:12px;color:#888;margin-top:20px">© 2026 MITHU | Fast & Secure</p>
</div>
<script>
async function getCode(){
 let n=document.getElementById('num').value.replace(/[^0-9]/g,'');
 if(!n){alert('Number eka danna!');return;}
 document.getElementById('code').innerHTML='Generating...';
 let res=await fetch('/code?number='+n);
 let data=await res.json();
 if(data.code){document.getElementById('code').innerHTML='CODE: '+data.code+'<br><br><small style=color:#fff>WhatsApp > Linked Devices > Link with phone number</small>'}
 else{document.getElementById('code').innerHTML=data.error || 'Error!'}
}
</script>
</body>
</html>
  `);
});

app.get('/code', async (req, res) => {
  let num = req.query.number.replace(/[^0-9]/g,'');
  if(!num) return res.json({error:'Number natha!'});
  
  try{
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: Browsers.macOS('Chrome')
    });

    sock.ev.on('creds.update', saveCreds);
    
    await delay(2000);
    
    if(!sock.authState.creds.registered){
      let code = await sock.requestPairingCode(num);
      code = code?.match(/.{1,4}/g)?.join('-') || code;
      res.json({code: code});
    } else {
      res.json({error:'Already registered'});
    }

    setTimeout(async () => {
      try { fs.rmSync('./session', { recursive: true, force: true }); } catch(e){}
    }, 60000);

  } catch(e){
    console.log(e);
    res.json({error: 'Error: '+ e.message});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('MITHU Pair Live on '+PORT));
