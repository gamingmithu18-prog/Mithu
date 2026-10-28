module.exports = {
 command: ['ping','speed'],
 execute: async (sock, m) => {
  const start = Date.now()
  await sock.sendMessage(m.key.remoteJid, { text: "*Testing...*" }, { quoted: m })
  const end = Date.now()
  await sock.sendMessage(m.key.remoteJid, { text: `*PONG!* ⚡\nSpeed: ${end-start}ms\n*MITHU MUSIC LIVE* ✅` }, { quoted: m })
 }
    }
