module.exports = {
 command: ['owner','me','mithu'],
 execute: async (sock, m) => {
  await sock.sendMessage(m.key.remoteJid, { text: "*MITHU MUSIC Owner*\nWa: wa.me/94741448572" }, { quoted: m })
 }
}
