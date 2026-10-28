const axios = require('axios')
module.exports = {
 command: ['fb','facebook','fbdl'],
 execute: async (sock, m, args) => {
  const jid = m.key.remoteJid
  if(!args[0]) return sock.sendMessage(jid, { text: "*Use:* .fb <link>" }, { quoted: m })
  try{
    await sock.sendMessage(jid, { text: "⏳ _Downloading FB..._" }, { quoted: m })
    const res = await axios.get(`https://facebook-downloader.vercel.app/api/downloader?url=${encodeURIComponent(args[0])}`)
    const videoUrl = res.data?.hd || res.data?.sd || res.data?.url
    await sock.sendMessage(jid, { video: { url: videoUrl }, caption: "*MITHU FB DL* ✅" }, { quoted: m })
  }catch(e){ await sock.sendMessage(jid, { text: "❌ Fail public link ekak danna" }, { quoted: m }) }
 }
}
