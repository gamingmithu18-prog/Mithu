const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const fs = require('fs')
const path = require('path')
const P = require('pino')
const config = require('./config')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ['MITHU MUSIC', 'Chrome', '1.0.0']
    })

    // Plugins load
    const pluginsPath = path.join(__dirname, 'plugins')
    const plugins = []
    if (fs.existsSync(pluginsPath)) {
        const files = fs.readdirSync(pluginsPath)
        for (const file of files) {
            if (file.endsWith('.js')) {
                try {
                    const plugin = require(path.join(pluginsPath, file))
                    if (plugin.command && plugin.execute) plugins.push(plugin)
                } catch(e){ console.log(`Plugin ${file} error:`, e.message) }
            }
        }
    }
    console.log(`Loaded ${plugins.length} plugins`)

    // Pairing Code - FIXED
    if (!sock.authState.creds.registered) {
        const phoneNumber = (process.env.PHONE_NUMBER || config.phoneNumber || "").replace(/[^0-9]/g,'')
        if (phoneNumber) {
            setTimeout(async () => {
                try {
                    let code = await sock.requestPairingCode(phoneNumber)
                    console.log(`\n\n=== PAIRING CODE FOR ${phoneNumber} ===`)
                    console.log(code)
                    console.log(`====================================\n\n`)
                } catch(e){ console.log("Pair error:", e.message) }
            }, 3000)
        } else {
            console.log("Add PHONE_NUMBER env! Eg: 947XXXXXXXX")
        }
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
        for (const plugin of plugins) {
            if (plugin.command.includes(cmd)) {
                try { await plugin.execute(sock, m, args, { config, plugins }) }
                catch(e){ await sock.sendMessage(m.key.remoteJid, { text: `Error: ${e.message}` }, { quoted: m }) }
                break
            }
        }
    })
}
startBot()
