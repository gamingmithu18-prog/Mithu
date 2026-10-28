const axios = require('axios')
module.exports = {
 command: ['tiktok','tt','tik'],
 execute: async (sock, m, args) => {
  const jid = m.key.remoteJid
  if(!args[0]) return sock.sendMessage(jid, { text: "*Use:* .tiktok <link>" }, { quoted: m })
  try{
    await sock.sendMessage(jid, { text: "⏳ _Downloading TikTok..._" }, { quoted: m })
    const res = await axios.get(`https://www.tikwm.com/api/?url=${args[0]}`)
    const data = res.data.data
    await sock.sendMessage(jid, { video: { url: data.play }, caption: `*MITHU TIKTOK*\n${data.title}\n> MITHU` }, { quoted: m })
  }catch(e){ await sock.sendMessage(jid, { text: "❌ Fail: "+e.message }, { quoted: m }) }
 }
                                 }
