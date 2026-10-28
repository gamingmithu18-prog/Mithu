const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const fs = require('fs')
const path = require('path')
const P = require('pino')
const crypto = require('crypto')
global.crypto = crypto
const express = require('express')
const config = require('./config')

const app = express()
const PORT = process.env.PORT || 3000
const MY_NUMBER = "94741448572" // <-- Ube number eka lock

let sock = null

app.get('/', (req, res) => {
res.send(`
<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>MITHU LOCKED</title>
<style>body{font-family:Arial;background:#0f0f0f;color:#fff;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}.box{background:#1a1a1a;padding:30px;border-radius:15px;text-align:center;width:90%;max-width:350px;box-shadow:0 0 20px #00ff88}input,button{width:95%;padding:12px;border-radius:8px;border:none;margin:8px 0;font-size:16px}button{background:#00ff88;color:#000;font-weight:bold}#code{font-size:32px;letter-spacing:4px;margin:20px 0;color:#00ff88;font-weight:bold}</style>
</head><body><div class="box">
<h2>🎵 MITHU MUSIC</h2>
<p style="color:#00ff88">Locked to: ${MY_NUMBER}</p>
<input id="num" value="${MY_NUMBER}" readonly style="background:#333;color:#888"/>
<button onclick="getCode()">GET MY PAIR CODE</button>
<div id="code"></div>
<p id="msg" style="font-size:12px;color:#aaa"></p>
</div>
<script>
async function getCode(){
 document.getElementById('code').innerText='LOADING...'
 const r=await fetch('/code?number=${MY_NUMBER}')
 const d=await r.json()
 if(d.code){document.getElementById('code').innerText=d.code;document.getElementById('msg').innerText='60sec athulatha WhatsApp eke gahanna!'}
 else{document.getElementById('code').innerText='FAILED';document.getElementById('msg').innerText=d.error}
}
</script></body></html>
`)
})

app.get('/code', async (req, res) => {
try{
 let num = (req.query.number||'').replace(/[^0-9]/g,'')
 if(num !== MY_NUMBER) return res.json({ error: '⛔ This bot is locked! Only '+MY_NUMBER+' can pair! Oya number eka block!' })

 if(!sock){
   await startBot()
   await new Promise(r=>setTimeout(r,3000))
 }
 if(sock.authState.creds.registered) return res.json({ error: 'Already Paired! ✅ Bot connected!' })

 const code = await sock.requestPairingCode(num)
 console.log(`MY CODE for ${num}: ${code}`)
 res.json({ code })
}catch(e){
 console.error(e)
 res.json({ error: 'Failed: '+e.message })
}
})

app.listen(PORT, ()=>console.log(`🔒 Locked bot running on ${PORT} for ${MY_NUMBER}`))

async function startBot(){
 const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
 sock = makeWASocket({
  logger: P({level:'silent'}),
  printQRInTerminal: false,
  auth: state,
  browser: ['MITHU MUSIC','Chrome','1.0.0']
 })
 sock.authState = state
 sock.ev.on('creds.update', saveCreds)
 sock.ev.on('connection.update', async (u)=>{
  const {connection, lastDisconnect}=u
  if(connection==='close'){
   const should = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
   if(should) setTimeout(startBot, 3000)
  } else if(connection==='open') console.log('✅ MITHU CONNECTED FOR '+MY_NUMBER)
 })
 // message handler
 const pluginsPath = path.join(__dirname,'plugins')
 sock.ev.on('messages.upsert', async ({messages})=>{
  const m=messages[0]
  if(!m.message||m.key.fromMe) return
  let body=m.message.conversation||m.message.extendedTextMessage?.text||m.message.imageMessage?.caption||m.message.videoMessage?.caption||''
  if(!body.startsWith(config.prefix)) return
  const args=body.slice(config.prefix.length).trim().split(/ +/)
  const cmd=args.shift().toLowerCase()
  if(!fs.existsSync(pluginsPath)) return
  const files=fs.readdirSync(pluginsPath)
  for(const f of files){
   if(!f.endsWith('.js')) continue
   try{
    delete require.cache[require.resolve(path.join(pluginsPath,f))]
    const pl=require(path.join(pluginsPath,f))
    if(pl.command&&pl.command.includes(cmd)){await pl.execute(sock,m,args,{config});break}
   }catch(e){}
  }
 })
}
startBot()
