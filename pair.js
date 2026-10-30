const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const app = express();

app.get('/', (req,res)=>{
res.send(`<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>LAKSHAN-MD Public Pair</title></head>
<body style="background:#0f0f0f;color:#fff;text-align:center;padding:20px;font-family:sans-serif">
<h2 style="color:#25D366">LAKSHAN-MD PUBLIC PAIR 🔥</h2>
<p>Onama kenekta pair karaganna puluwan</p>
<input id="num" placeholder="947xxxxxxxx" style="padding:14px;width:85%;max-width:320px;border-radius:10px;border:none;font-size:16px">
<br><br><button onclick="getCode()" style="padding:14px 30px;background:#25D366;border:none;border-radius:10px;color:#fff;font-weight:bold;font-size:16px">GET PAIR CODE</button>
<h1 id="out" style="letter-spacing:5px;margin-top:25px;color:#25D366"></h1>
<p id="msg" style="color:#888"></p>
<script>
async function getCode(){
 const n=document.getElementById('num').value;
 if(!n) return alert('Number eka danna machan!');
 document.getElementById('out').innerText=''; 
 document.getElementById('msg').innerText='Generating... 10sec inna';
 let r=await fetch('/code?number='+n); let d=await r.json();
 document.getElementById('out').innerText=d.code||'';
 document.getElementById('msg').innerText=d.code ? 'Code eka 15sec athulatha WhatsApp eke dapan!' : d.error;
}
</script>
<p style="margin-top:30px;color:#555">© LAKSHAN-MD 2026</p>
</body></html>`);
});

app.get('/code', async(req,res)=>{
 let num=(req.query.number||'').replace(/[^0-9]/g,'');
 if(!num || num.length < 10) return res.json({error:'Number eka hariyata danna 947xxxxxxxx'});
 let dir='./tmp_'+Date.now();
 try{
  const {state,saveCreds}=await useMultiFileAuthState(dir);
  const sock=makeWASocket({
   logger:pino({level:'silent'}),
   printQRInTerminal:false,
   auth:state,
   browser:['Chrome','Windows','10']
  });
  sock.ev.on('creds.update',saveCreds);
  if(!sock.authState.creds.registered){
   await delay(3000);
   let code=await sock.requestPairingCode(num);
   console.log('Public Pair:',code,' for',num);
   if(!res.headersSent) res.json({code:code});
   await delay(60000);
  }
 }catch(e){
  console.log(e);
  if(!res.headersSent) res.json({error:'Error: '+e.message+' - Aye try karapan'});
 }finally{
  try{fs.rmSync(dir,{recursive:true,force:true})}catch{}
 }
});

const PORT=process.env.PORT||3000;
app.listen(PORT,'0.0.0.0',()=>console.log('Public Pair running on '+PORT));
