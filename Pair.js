const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const P = require("pino")
async function startPair() {
    const { state, saveCreds } = await useMultiFileAuthState('./pair-session')
    const sock = makeWASocket({ auth: state, logger: P({ level: 'silent' }), printQRInTerminal: false, browser: ["Ubuntu", "Chrome", "20.0.04"] })
    sock.ev.on('creds.update', saveCreds)
    const num = "94741448572"
    setTimeout(async () => {
        try {
            let code = await sock.requestPairingCode(num)
            code = code?.match(/.{1,4}/g)?.join("-") || code
            console.log(`\nCODE FOR ${num}: ${code}\n`)
        } catch(e){ console.log(e.message) }
    }, 5000)
}
startPair()
