const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

const app = express();

app.get('/', (req,res)=>{
res.send(`<html><body style="background:#111;color:#fff;text-align:center;padding:20px;font-family:sans-serif">
<h2>LAKSHAN-MD PAIR 🔥 V3</h2>
<input id="num" placeholder="947xxxxxxxx" style="padding:12px;width:80%;max-width:300px;border-radius:8px;border:none">
<br><br><button onclick="getCode()" style="padding:12px 25px;background:#25D366;border:none;border-radius:8px;color:#fff;font-weight:bold">GET CODE</button>
<h1 id="out" style="letter-spacing:4px;margin-top:20px"></h1>
<p style="color:#888">Code eka awa gaman 15sec athulatha dapan!</p>
<script>
async function getCode(){
 const n=document.getElementById('num').value;
 if(!n) return alert('Number danna!');
 document.getElementById('out').innerText='Generating...';
 let r=await fetch('/code?number='+n); let d=await r.json();
 document.getElementById('out').innerText=d.code||d.error;
}
</script></body></html>`);
});

app.get('/code', async(req,res)=>{
 let num=(req.query.number||'').replace(/[^0-9]/g,'');
 if(!num) return res.json({error:'Number danna'});
 let dir='./tmp_'+Date.now();
 try{
  const {state,saveCreds}=await useMultiFileAuthState(dir);
  const sock=makeWASocket({
   logger:pino({level:'silent'}),
   printQRInTerminal:false,
   auth:state,
   browser:['Chrome','Windows','10'],
   syncFullHistory:false
  });
  sock.ev.on('creds.update',saveCreds);
  if(!sock.authState.creds.registered){
   await delay(3000);
   let code=await sock.requestPairingCode(num);
   console.log('Pair Code:',code,' for ',num);
   if(!res.headersSent) res.json({code:code});
   // 60 sec thiyanna
   await delay(60000);
  }
 }catch(e){
  console.log(e);
  if(!res.headersSent) res.json({error:e.message});
 }finally{
  try{fs.rmSync(dir,{recursive:true,force:true})}catch{}
 }
});

const PORT=process.env.PORT||3000;
app.listen(PORT,'0.0.0.0',()=>console.log('V3 running on '+PORT));
