const ytSearch = require('yt-search')
module.exports = {
 command: ['csong','yta','ytmp3','songdl'],
 execute: async (sock, m, args) => {
  const jid = m.key.remoteJid
  if(!args[0]) return sock.sendMessage(jid, { text: "*Use:* .csong <name>" }, { quoted: m })
  try{
    const q = args.join(" ")
    await sock.sendMessage(jid, { text: `🎵 _Searching: ${q}_...` }, { quoted: m })
    const r = await ytSearch(q)
    const video = r.videos[0]
    const txt = `*🎧 ${video.title}*\n\nDuration: ${video.timestamp}\n\n*DL Link:*\nhttps://ytmp3.cc/en12/${video.videoId}\n\nOriginal: ${video.url}\n\n> MITHU CS SONG`
    await sock.sendMessage(jid, { image: { url: video.thumbnail }, caption: txt }, { quoted: m })
  }catch(e){ await sock.sendMessage(jid, { text: "Error: "+e.message }, { quoted: m }) }
 }
                                                                                                                                         }
