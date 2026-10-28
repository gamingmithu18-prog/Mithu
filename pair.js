const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

const app = express();

app.get('/', (req,res)=>{
 res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{background:#000;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:sans-serif}.c{background:#111;border:2px solid #00ff88;border-radius:20px;padding:30px;width:90%;max-width:400px;text-align:center}h1{color:#00ff88}input{width:85%;padding:14px;border-radius:10px;border:none;margin:15px 0;font-size:18px}button{width:90%;padding:14px;background:#00ff88;color:#000;font-weight:bold;border:none;border-radius:10px;font-size:18px}#o{color:#00ff88;margin-top:15px;font-size:20px;font-weight:bold}</style></head><body><div class="c"><h1>🎵 MITHU MUSIC</h1><input id="n" placeholder="9471xxxxxxx"><button onclick="g()">GET CODE</button><div id="o"></div><script>async function g(){let v=document.getElementById('n').value.replace(/[^0-9]/g,'');if(!v)return alert('Number');document.getElementById('o').innerHTML='Wait 8 sec...';let r=await fetch('/code?number='+v);let d=await r.json();if(d.code)document.getElementById('o').innerHTML='CODE: '+d.code+'<br><br><small style=color:#fff>Code eka gahala phone eka close karanna epa! 1 min inna!</small>';else document.getElementById('o').innerHTML=d.error}</script></div></body></html>`);
});

let activeSockets = {};

app.get('/code', async (req,res)=>{
 let num = req.query.number.replace(/[^0-9]/g,'');
 if(!num) return res.json({error:'Number?'});
 let dir = './auth-'+num;
 try{
   if(fs.existsSync(dir)) fs.rmSync(dir,{recursive:true,force:true});
   const {state, saveCreds} = await useMultiFileAuthState(dir);
   const sock = makeWASocket({
     auth: state,
     printQRInTerminal: false,
     logger: pino({level:'silent'}),
     browser: Browsers.ubuntu('Chrome'),
     markOnlineOnConnect: false
   });
   activeSockets[num] = sock;
   sock.ev.on('creds.update', saveCreds);
   sock.ev.on('connection.update', async (u)=>{
     if(u.connection==='open'){
       console.log('PAIRED:',num);
     }
     if(u.connection==='close'){
       console.log('Closed',num);
       try{delete activeSockets[num]}catch{}
     }
   });
   await delay(3000);
   let code = await sock.requestPairingCode(num);
   code = code.match(/.{1,4}/g).join('-');
   console.log(num+' CODE: '+code);
   res.json({code: code});
   // 3 MIN KEEP ALIVE - CLOSE KARANNA EPA
   setTimeout(()=>{ try{sock.end()}catch{} }, 180000);
 }catch(e){
   console.log(e);
   res.json({error: e.message});
 }
});

app.listen(3000, ()=>console.log('MITHU LIVE 3000'));
