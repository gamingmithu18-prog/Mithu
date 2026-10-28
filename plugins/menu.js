module.exports = {
 command: ['menu','help','list','bot'],
 execute: async (sock, m, args, {config}) => {
  const txt = `*${config.botName}*\n\n*🎵 MENU LIST 🎵*\n\n.menu - menu eka\n.ping - bot live da balanna\n.song <name> - sindu hoyanna\n.play <name> - sindu play\n.owner - owner contact\n.tiktok <link> - tiktok dl\n.fb <link> - fb video dl\n.csong <name> - song dl link\n\n_Powered by MITHU_`
  await sock.sendMessage(m.key.remoteJid, { text: txt }, { quoted: m })
 }
}
