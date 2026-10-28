const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys")
const P = require("pino")
const fs = require("fs")
const path = require("path")
const config = require("./config")

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session')
    const { version } = await fetchLatestBaileysVersion()
    const sock = makeWASocket({
        version, auth: state,
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ["MITHU MUSIC", "Chrome", "1.0"]
    })
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', async (up) => {
        const { connection, lastDisconnect } = up
        if(connection === 'open') console.log("✅ MITHU MUSIC CONNECTED!")
        if(connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode
            if(code !== DisconnectReason.loggedOut) startBot()
        }
    })
    sock.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const m = messages[0]
            if(!m.message) return
            const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || ""
            if(!body.startsWith(config.prefix)) return
            const args = body.slice(1).trim().split(/ +/)
            const command = args.shift().toLowerCase()
            const pluginsPath = path.join(__dirname, 'plugins')
            if(!fs.existsSync(pluginsPath)) return
            const files = fs.readdirSync(pluginsPath)
            for(const file of files) {
                delete require.cache[require.resolve(path.join(pluginsPath, file))]
                const plugin = require(path.join(pluginsPath, file))
                if(plugin.command && plugin.command.includes(command)) {
                    await plugin.execute(sock, m, args, { config })
                }
            }
        } catch(e){ console.log("Error:", e.message) }
    })
}
startBot()
