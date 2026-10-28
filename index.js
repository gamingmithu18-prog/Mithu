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
let sock = null
let lastCode = null

app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>MITHU MUSIC - Pair</title>
        <style>
            body{font-family:Arial;background:#0f0f0f;color:#fff;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}
            .box{background:#1a1a1a;padding:30px;border-radius:15px;text-align:center;width:90%;max-width:350px;box-shadow:0 0 20px #00ff88}
            input{width:90%;padding:12px;border-radius:8px;border:none;margin:10px 0;font-size:16px}
            button{width:95%;padding:12px;background:#00ff88;color:#000;border:none;border-radius:8px;font-weight:bold;font-size:16px;cursor:pointer}
            #code{font-size:32px;letter-spacing:5px;margin:20px 0;color:#00ff88;font-weight:bold}
        </style>
    </head>
    <body>
        <div class="box">
            <h2>🎵 MITHU MUSIC</h2>
            <p>Phone Number (947XXXXXXXX)</p>
            <input id="num" placeholder="94741448572" value="94741448572"/>
            <button onclick="getCode()">GET PAIR CODE</button>
            <div id="code"></div>
            <p id="msg" style="font-size:13px;color:#aaa"></p>
            <p style="font-size:12px;margin-top:15px">WhatsApp > Linked Devices > Link with phone number > Enter Code</p>
        </div>
        <script>
            async function getCode(){
                const n = document.getElementById('num').value
                document.getElementById('code').innerText='LOADING...'
                document.getElementById('msg').innerText='Wait 5 seconds...'
                const r = await fetch('/code?number='+n)
                const d = await r.json()
                if(d.code){
                    document.getElementById('code').innerText=d.code
                    document.getElementById('msg').innerText='Code eka copy karala WhatsApp eke gahanna! Expire in 2min'
                } else {
                    document.getElementById('code').innerText=''
                    document.getElementById('msg').innerText=d.error || 'Error'
                }
            }
        </script>
    </body>
    </html>
    `)
})

app.get('/code', async (req, res) => {
    try {
        const num = (req.query.number || '').replace(/[^0-9]/g,'')
        if(!num) return res.json({ error: 'Number eka danna 947XXXXXXXX' })
        if(!sock) return res.json({ error: 'Bot start wela na, 10sec innna' })
        if(sock.authState.creds.registered) return res.json({ error: 'Already Paired! ✅' })
        const code = await sock.requestPairingCode(num)
        lastCode = code
        console.log(`PAIR CODE FOR ${num}: ${code}`)
        res.json({ code })
    } catch(e){
        console.log('Pair error:', e.message)
        res.json({ error: e.message })
    }
})

app.listen(PORT, () => console.log(`Web running on ${PORT}`))

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ['MITHU MUSIC', 'Chrome', '1.0.0']
    })

    const pluginsPath = path.join(__dirname, 'plugins')
    if (fs.existsSync(pluginsPath)) {
        const files = fs.readdirSync(pluginsPath)
        console.log(`Loaded ${files.filter(f=>f.endsWith('.js')).length} plugins`)
    }

    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut
            console.log('Connection closed, reconnecting:', shouldReconnect)
            if (shouldReconnect) startBot()
        } else if (connection === 'open') {
            console.log('MITHU MUSIC CONNECTED ✅')
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if (!m.message || m.key.fromMe) return
        let body = ''
        if (m.message.conversation) body = m.message.conversation
        else if (m.message.extendedTextMessage) body = m.message.extendedTextMessage.text
        else if (m.message.imageMessage) body = m.message.imageMessage.caption || ''
        else if (m.message.videoMessage) body = m.message.videoMessage.caption || ''
        if (!body.startsWith(config.prefix)) return
        const args = body.slice(config.prefix.length).trim().split(/ +/)
        const cmd = args.shift().toLowerCase()
        try {
            const pluginsPath = path.join(__dirname, 'plugins')
            const files = fs.readdirSync(pluginsPath)
            for (const file of files) {
                if (!file.endsWith('.js')) continue
                try {
                    delete require.cache[require.resolve(path.join(pluginsPath, file))]
                    const plugin = require(path.join(pluginsPath, file))
                    if (plugin.command && plugin.command.includes(cmd)) {
                        await plugin.execute(sock, m, args, { config })
                        break
                    }
                } catch(e){}
            }
        } catch(e){ console.log(e.message) }
    })
}
startBot()
