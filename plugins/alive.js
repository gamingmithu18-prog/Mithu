module.exports = {
 command: ['alive','bot','live'],
 execute: async (sock, m, {config}) => {
  await sock.sendMessage(m.key.remoteJid, { text: `*${config.botName} is ALIVE!* ✅\nPrefix: ${config.prefix}` }, { quoted: m })
 }
}
