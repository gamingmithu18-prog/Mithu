const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const path = require('path')
const P = require('pino')
const config = require('./config')
const { default: axios } = require('axios')

// Pair code system
let pairingCode = false
if (process.argv.includes('--pair')) pairingCode = true

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: !pairingCode,
        auth: state,
        browser: ['MITHU MUSIC', 'Chrome', '1.0.0']
    })

    // Load plugins
    const pluginsPath = path.join(__dirname, 'plugins')
    const plugins = []
    if (fs.existsSync(pluginsPath)) {
        const files = fs.readdirSync(pluginsPath)
        for (const file of files) {
            if (file.endsWith('.js')) {
                try {
                    const plugin = require(path.join(pluginsPath, file))
                    if (plugin.command && plugin.execute) {
                        plugins.push(plugin)
                    }
                } catch(e){ console.log(`Plugin ${file} error:`, e.message) }
            }
        }
    }
    console.log(`Loaded ${plugins.length} plugins`)

    if (pairingCode && !sock.authState.creds.registered) {
        const phoneNumber = process.env.PHONE_NUMBER || config.phoneNumber
        if (phoneNumber) {
            setTimeout(async () => {
                let code = await sock.requestPairingCode(phoneNumber.replace(/[^0-9]/g,''))
                console.log(`Pairing code: ${code}`)
            }, 3000)
        }
    }

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) startBot()
        } else if (connection === 'open') {
            console.log('MITHU MUSIC CONNECTED ✅')
            await sock.sendMessage(sock.user.id, { text: `*MITHU MUSIC BOT CONNECTED* ✅\n\nPlugins: ${plugins.length}\nPrefix: ${config.prefix}\n\nType ${config.prefix}menu` })
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if (!m.message || m.key.fromMe) return
        const msgType = Object.keys(m.message)[0]
        let body = ''
        if (msgType === 'conversation') body = m.message.conversation
        else if (msgType === 'extendedTextMessage') body = m.message.extendedTextMessage.text
        else if (msgType === 'imageMessage') body = m.message.imageMessage.caption || ''
        else if (msgType === 'videoMessage') body = m.message.videoMessage.caption || ''

        if (!body.startsWith(config.prefix)) return

        const args = body.slice(config.prefix.length).trim().split(/ +/)
        const cmd = args.shift().toLowerCase()

        for (const plugin of plugins) {
            if (plugin.command.includes(cmd)) {
                try {
                    await plugin.execute(sock, m, args, { config, plugins })
                } catch(e){
                    console.log(e)
                    await sock.sendMessage(m.key.remoteJid, { text: `Error: ${e.message}` }, { quoted: m })
                }
                break
            }
        }
    })
}

startBot()
