const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const app = express();

app.get('/', (req,res)=>{
res.send(`<html><body style="background:#000;color:#0f0;text-align:center;padding:20px;font-family:monospace">
<h2>LAKSHAN-MD PAIR V4 - FIXED 🔥</h2>
<input id="n" placeholder="94712345678" style="padding:12px;width:90%;border-radius:8px;border:none">
<br><br><button onclick="go()" style="padding:12px 30px;background:#0f0;color:#000;font-weight:bold;border:none;border-radius:8px">GET CODE</button>
<h1 id="c" style="font-size:32px;letter-spacing:6px;margin-top:20px"></h1>
<p id="m" style="color:#888"></p>
<script>
async function go(){
 let num=document.getElementById('n').value.trim();
 if(!num) return alert('Number danna!');
 document.getElementById('m').innerText='Wait 5 sec...';
 let r=await fetch('/code?number='+num); let d=await r.json();
 console.log(d);
 document.getElementById('c').innerText=d.code||'';
 document.getElementById('m').innerText=d.code ? 'CODE ENAA! 20sec athulatha dapan WhatsApp > Linked Devices > Link with phone number' : (d.error||'Error');
}
</script></body></html>`);
});

app.get('/code', async(req,res)=>{
 let number = (req.query.number||'').replace(/[^0-9]/g,'');
 console.log('Request for:',number);
 if(!number) return res.json({error:'Number eka danna!'});
 if(number.startsWith('0')) number='94'+number.substring(1);
 if(!number.startsWith('94')) number='94'+number;

 let dir = './tmp_'+Date.now();
 try{
  const {state, saveCreds} = await useMultiFileAuthState(dir);
  const sock = makeWASocket({
   auth: state,
   logger: pino({level:'silent'}),
   browser: Browsers.ubuntu('Chrome'),
   printQRInTerminal: false,
   syncFullHistory: false
  });
  sock.ev.on('creds.update', saveCreds);

  // wait for socket open
  await delay(3500);

  if(!sock.authState.creds.registered){
   console.log('Requesting pairing code for',number);
   const code = await sock.requestPairingCode(number);
   console.log('CODE:',code);
   if(!res.headersSent) return res.json({code: code});
  } else {
   if(!res.headersSent) return res.json({error:'Already registered'});
  }
  await delay(45000);
 } catch(e){
  console.error('PAIR ERROR:',e);
  if(!res.headersSent) return res.json({error: e.message});
 } finally {
  try{fs.rmSync(dir,{recursive:true,force:true})}catch{}
 }
});

app.listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('V4 FIXED running'));
