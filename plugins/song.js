const ytSearch = require('yt-search')
module.exports = {
 command: ['song','play','music','sindu'],
 execute: async (sock, m, args) => {
  const jid = m.key.remoteJid
  if(!args[0]) return sock.sendMessage(jid, { text: "Use: .song despacito" }, { quoted: m })
  try {
    const q = args.join(" ")
    await sock.sendMessage(jid, { text: `🔍 _Searching:_ ${q}...` }, { quoted: m })
    const r = await ytSearch(q)
    const video = r.videos[0]
    const txt = `*🎵 ${video.title}*\n\n⏱️ ${video.timestamp}\n👁️ ${video.views}\n🔗 ${video.url}\n\n> MITHU MUSIC`
    await sock.sendMessage(jid, { image: { url: video.thumbnail }, caption: txt }, { quoted: m })
  } catch(e){ await sock.sendMessage(jid, { text: "Error: "+e.message }, { quoted: m }) }
 }
      }
