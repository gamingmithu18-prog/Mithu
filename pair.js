const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay, Browsers, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

app.get('/', (req,res)=>{
 res.send(`
<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<title>MITHU PAIR</title>
<style>body{background:#000;color:#fff;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;font-family:sans-serif}
.box{background:#111;border:2px solid #00ff88;border-radius:20px;padding:25px;width:90%;max-width:380px;text-align:center}
h1{color:#00ff88} input{width:85%;padding:14px;border-radius:10px;border:0;margin:10px 0;font-size:18px}
button{width:90%;padding:14px;background:#00ff88;color:#000;font-weight:900;border:0;border-radius:10px;font-size:18px}
#out{margin-top:15px;word-break:break-all;color:#00ff88;font-weight:bold;font-size:20px}</style>
</head><body><div class="box"><h1>🎵 MITHU MUSIC BOT</h1><p>Official Pair Site</p>
<input id="num" placeholder="9471xxxxxxx"><button onclick="go()">GET PAIR CODE</button><div id="out"></div>
<script>async function go(){let n=document.getElementById('num').value.replace(/[^0-9]/g,'');if(!n){alert('Number danna');return}
document.getElementById('out').innerHTML='Generating... Wait 10 sec';let r=await fetch('/code?number='+n);let d=await r.json();
if(d.code){document.getElementById('out').innerHTML='YOUR CODE:<br><span style=font-size:28px;letter-spacing:3px>'+d.code+'</span><br><br><small style=color:#fff>WhatsApp > Linked Devices > Link with phone number</small>'}
else{document.getElementById('out').innerHTML=d.error}}</script></div></body></html>`);
});

app.get('/code', async (req,res)=>{
 let num = (req.query.number||'').replace(/[^0-9]/g,'');
 if(!num) return res.json({error:'Number natha'});
 let sessionDir = './session-'+num;
 try{
   if(fs.existsSync(sessionDir)) fs.rmSync(sessionDir,{recursive:true,force:true});
   const {state, saveCreds} = await useMultiFileAuthState(sessionDir);
   const sock = makeWASocket({
     auth: state,
     logger: pino({level:'silent'}),
     printQRInTerminal: false,
     browser: Browsers.macOS('Desktop'),
     syncFullHistory: false
   });
   sock.ev.on('creds.update', saveCreds);

   sock.ev.on('connection.update', async (up)=>{
     const {connection, lastDisconnect} = up;
     if(connection==='open'){
       console.log('Connected '+num);
       // 3 min passe delete
       setTimeout(()=>{ try{fs.rmSync(sessionDir,{recursive:true,force:true})}catch(e){} }, 180000);
     }
     if(connection==='close'){
       let reason = lastDisconnect?.error?.output?.statusCode;
       console.log('Closed',reason);
     }
   });

   await delay(4000);
   if(sock.authState.creds.registered){
     return res.json({error:'Already paired. Delete session folder'});
   }
   let code = await sock.requestPairingCode(num);
   code = code?.match(/.{1,4}/g)?.join('-') || code;
   res.json({code});

   // 5 min keep alive
   setTimeout(()=>{ try{ sock.end(); fs.rmSync(sessionDir,{recursive:true,force:true})}catch(e){} }, 300000);

 }catch(e){
   console.log('Pair Error:',e);
   try{fs.rmSync(sessionDir,{recursive:true,force:true})}catch{}
   res.json({error:'Failed: '+e.message+' - Retry after 1 min'});
 }
});

app.listen(process.env.PORT||3000, ()=>console.log('MITHU LIVE'));
