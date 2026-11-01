require('dotenv').config();
const { Client, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const express = require('express');

// --- UptimeRobot & Render Uyku Önleyici Web Sunucusu ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot 7/24 aktif ve çalışıyor!');
});

app.listen(PORT, () => {
  console.log(`🌐 Web sunucusu ${PORT} portunda dinleniyor.`);
});

// --- Discord Bot Kurulumu ---
const TOKEN = process.env.TOKEN;
const PREFIXES = [".", "!"];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.once('ready', () => {
  console.log(`✅ Bot ${client.user.tag} olarak başarıyla aktif edildi!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  let prefixUsed = null;
  for (const p of PREFIXES) {
    if (message.content.startsWith(p)) {
      prefixUsed = p;
      break;
    }
  }
  if (!prefixUsed) return;

  const args = message.content.slice(prefixUsed.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const member = message.member;
  const guild = message.guild;

  // -------------------------------------------------------------
  // 👥 1-10: CEZA & MODERASYON KOMUTLARI
  // -------------------------------------------------------------
  if (command === 'kick') {
    if (!member.permissions.has(PermissionFlagsBits.KickMembers)) return message.reply('❌ Yetkiniz yok.');
    const target = message.mentions.members.first();
    const reason = args.slice(1).join(' ') || 'Sebep yok.';
    if (!target) return message.reply('❌ Lütfen bir kullanıcı etiketleyin.');
    if (!target.kickable) return message.reply('❌ Bu kullanıcıyı atamam.');
    await target.kick(reason);
    return message.reply(`✅ **${target.user.tag}** atıldı. (Sebep: ${reason})`);
  }

  if (command === 'ban') {
    if (!member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ Yetkiniz yok.');
    const target = message.mentions.members.first() || args[0];
    const reason = args.slice(1).join(' ') || 'Sebep yok.';
    if (!target) return message.reply('❌ Kullanıcı belirtin.');
    try {
      await guild.members.ban(target, { reason });
      return message.reply(`✅ Kullanıcı yasaklandı.`);
    } catch {
      return message.reply('❌ Yasaklama başarısız.');
    }
  }

  if (command === 'unban') {
    if (!member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ Yetkiniz yok.');
    const userId = args[0];
    if (!userId) return message.reply('❌ Kullanıcı ID girin.');
    try {
      await guild.members.unban(userId);
      return message.reply(`✅ **${userId}** yasağı kaldırıldı.`);
    } catch {
      return message.reply('❌ Ban bulunamadı.');
    }
  }

  if (command === 'mute' || command === 'timeout') {
    if (!member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ Yetkiniz yok.');
    const target = message.mentions.members.first();
    const duration = parseInt(args[1]);
    if (!target || isNaN(duration)) return message.reply('❌ Kullanım: `.mute @kullanıcı [dakika]`');
    await target.timeout(duration * 60 * 1000, 'Susturuldu');
    return message.reply(`✅ **${target.user.tag}** ${duration} dakika susturuldu.`);
  }

  if (command === 'unmute' || command === 'untimeout') {
    if (!member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ Yetkiniz yok.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Kullanıcı etiketleyin.');
    await target.timeout(null);
    return message.reply(`✅ **${target.user.tag}** susturması kaldırıldı.`);
  }

  if (command === 'softban') {
    if (!member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ Yetkiniz yok.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Kullanıcı etiketleyin.');
    await guild.members.ban(target, { deleteMessageSeconds: 604800, reason: 'Softban' });
    await guild.members.unban(target.id);
    return message.reply(`✅ **${target.user.tag}** softbanlandı.`);
  }

  if (command === 'warn') {
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ Yetkiniz yok.');
    const target = message.mentions.members.first();
    const reason = args.slice(1).join(' ') || 'Sebep yok.';
    if (!target) return message.reply('❌ Kullanıcı etiketleyin.');
    return message.reply(`⚠️ **${target.user.tag}** uyarıldı! Sebep: ${reason}`);
  }

  if (command === 'tempban') {
    if (!member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ Yetkiniz yok.');
    const target = message.mentions.members.first();
    const minutes = parseInt(args[1]);
    if (!target || isNaN(minutes)) return message.reply('❌ Kullanım: `.tempban @kullanıcı [dakika]`');
    await guild.members.ban(target, { reason: 'Gecici Ban' });
    message.reply(`✅ **${target.user.tag}** ${minutes} dakika yasaklandı.`);
    setTimeout(async () => { await guild.members.unban(target.id).catch(() => {}); }, minutes * 60000);
    return;
  }

  if (command === 'forceban') {
    if (!member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ Yetkiniz yok.');
    const userId = args[0];
    if (!userId) return message.reply('❌ ID girin.');
    await guild.members.ban(userId);
    return message.reply(`✅ **${userId}** ID\\'li kullanıcı banlandı.`);
  }

  if (command === 'jail') {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('❌ Yönetici yetkisi gerekli.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Kullanıcı etiketleyin.');
    await target.roles.set([]);
    return message.reply(`🔒 **${target.user.tag}** jaile atıldı.`);
  }

  // -------------------------------------------------------------
  // 🧹 11-20: SOHBET & KANAL TEMİZLİK KOMUTLARI
  // -------------------------------------------------------------
  if (command === 'clear' || command === 'sil') {
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ Yetkiniz yok.');
    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100) return message.reply('❌ 1-100 arası sayı girin.');
    await message.channel.bulkDelete(amount, true);
    const msg = await message.channel.send(`🧹 **${amount}** mesaj silindi.`);
    setTimeout(() => msg.delete().catch(() => {}), 3000);
    return;
  }

  if (command === 'clearuser') {
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ Yetkiniz yok.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Kullanıcı etiketleyin.');
    const messages = await message.channel.messages.fetch({ limit: 50 });
    const userMsgs = messages.filter(m => m.author.id === target.id);
    await message.channel.bulkDelete(userMsgs, true);
    return message.reply(`🧹 **${target.user.tag}** kullanıcısının mesajları silindi.`);
  }

  if (command === 'clearbots') {
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ Yetkiniz yok.');
    const messages = await message.channel.messages.fetch({ limit: 50 });
    const botMsgs = messages.filter(m => m.author.bot);
    await message.channel.bulkDelete(botMsgs, true);
    return message.reply('🤖 Bot mesajları silindi.');
  }

  if (command === 'nuke') {
    if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) return message.reply('❌ Yetkiniz yok.');
    const pos = message.channel.position;
    const newChan = await message.channel.clone();
    await message.channel.delete();
    await newChan.setPosition(pos);
    return newChan.send('💥 Kanal sıfırlandı!');
  }

  if (command === 'lock') {
    if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) return message.reply('❌ Yetkiniz yok.');
    await message.channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
    return message.reply('🔒 Kanal kilitlendi.');
  }

  if (command === 'unlock') {
    if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) return message.reply('❌ Yetkiniz yok.');
    await message.channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: true });
    return message.reply('🔓 Kanal kilidi açıldı.');
  }

  if (command === 'slowmode') {
    if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) return message.reply('❌ Yetkiniz yok.');
    const sec = parseInt(args[0]);
    if (isNaN(sec)) return message.reply('❌ Saniye girin.');
    await message.channel.setRateLimitPerUser(sec);
    return message.reply(`⏱️ Yavaş mod ${sec} saniye yapıldı.`);
  }

  if (command === 'slowmode-off') {
    if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) return message.reply('❌ Yetkiniz yok.');
    await message.channel.setRateLimitPerUser(0);
    return message.reply('⏱️ Yavaş mod kapatıldı.');
  }

  if (command === 'clearemojis') {
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ Yetkiniz yok.');
    const messages = await message.channel.messages.fetch({ limit: 50 });
    const emojiMsgs = messages.filter(m => /<a?:.+?:\d+>|[\u{1F600}-\u{1F64F}]/u.test(m.content));
    await message.channel.bulkDelete(emojiMsgs, true);
    return message.reply('😀 Emoji mesajları silindi.');
  }

  if (command === 'clearlinks') {
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ Yetkiniz yok.');
    const messages = await message.channel.messages.fetch({ limit: 50 });
    const linkMsgs = messages.filter(m => /(https?:\/\/[^\s]+)/g.test(m.content));
    await message.channel.bulkDelete(linkMsgs, true);
    return message.reply('🔗 Link içeren mesajlar silindi.');
  }

  // -------------------------------------------------------------
  // 🛡️ 21-30: ROL & YETKİ YÖNETİMİ KOMUTLARI
  // -------------------------------------------------------------
  if (command === 'role-add' || command === 'rol-ver') {
    if (!member.permissions.has(PermissionFlagsBits.ManageRoles)) return message.reply('❌ Yetkiniz yok.');
    const target = message.mentions.members.first();
    const role = message.mentions.roles.first();
    if (!target || !role) return message.reply('❌ Kullanım: `.role-add @kullanıcı @rol`');
    await target.roles.add(role);
    return message.reply(`✅ **${target.user.tag}** kullanıcısına **${role.name}** verildi.`);
  }

  if (command === 'role-remove' || command === 'rol-al') {
    if (!member.permissions.has(PermissionFlagsBits.ManageRoles)) return message.reply('❌ Yetkiniz yok.');
    const target = message.mentions.members.first();
    const role = message.mentions.roles.first();
    if (!target || !role) return message.reply('❌ Kullanım: `.role-remove @kullanıcı @rol`');
    await target.roles.remove(role);
    return message.reply(`✅ **${target.user.tag}** kullanıcısından **${role.name}** alındı.`);
  }

  if (command === 'role-all') {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('❌ Yönetici yetkisi gerekli.');
    const role = message.mentions.roles.first();
    if (!role) return message.reply('❌ Rol etiketleyin.');
    const members = await guild.members.fetch();
    members.forEach(m => m.roles.add(role).catch(() => {}));
    return message.reply(`✅ Herkese **${role.name}** verme işlemi başladı.`);
  }

  if (command === 'role-remove-all') {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('❌ Yönetici yetkisi gerekli.');
    const role = message.mentions.roles.first();
    if (!role) return message.reply('❌ Rol etiketleyin.');
    const members = await guild.members.fetch();
    members.forEach(m => m.roles.remove(role).catch(() => {}));
    return message.reply(`✅ Herkesten **${role.name}** alma işlemi başladı.`);
  }

  if (command === 'role-create') {
    if (!member.permissions.has(PermissionFlagsBits.ManageRoles)) return message.reply('❌ Yetkiniz yok.');
    const roleName = args.join(' ');
    if (!roleName) return message.reply('❌ Rol adı girin.');
    const r = await guild.roles.create({ name: roleName });
    return message.reply(`✅ **${r.name}** rolü oluşturuldu.`);
  }

  if (command === 'role-delete') {
    if (!member.permissions.has(PermissionFlagsBits.ManageRoles)) return message.reply('❌ Yetkiniz yok.');
    const role = message.mentions.roles.first();
    if (!role) return message.reply('❌ Rol etiketleyin.');
    await role.delete();
    return message.reply('✅ Rol silindi.');
  }

  if (command === 'role-info') {
    const role = message.mentions.roles.first();
    if (!role) return message.reply('❌ Rol etiketleyin.');
    const embed = new EmbedBuilder().setTitle(`Rol: ${role.name}`).setColor(role.color).addFields({ name: 'ID', value: role.id, inline: true }, { name: 'Üye', value: `${role.members.size}`, inline: true });
    return message.reply({ embeds: [embed] });
  }

  if (command === 'nick' || command === 'setnick') {
    if (!member.permissions.has(PermissionFlagsBits.ManageNicknames)) return message.reply('❌ Yetkiniz yok.');
    const target = message.mentions.members.first();
    const newNick = args.slice(1).join(' ');
    if (!target || !newNick) return message.reply('❌ Kullanım: `.nick @kullanıcı İsim`');
    await target.setNickname(newNick);
    return message.reply(`✅ Adı değiştirildi.`);
  }

  if (command === 'reset-nick') {
    if (!member.permissions.has(PermissionFlagsBits.ManageNicknames)) return message.reply('❌ Yetkiniz yok.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Kullanıcı etiketleyin.');
    await target.setNickname(null);
    return message.reply(`✅ Takma ad sıfırlandı.`);
  }

  if (command === 'role-color') {
    if (!member.permissions.has(PermissionFlagsBits.ManageRoles)) return message.reply('❌ Yetkiniz yok.');
    const role = message.mentions.roles.first();
    const hex = args[1];
    if (!role || !hex) return message.reply('❌ Kullanım: `.role-color @rol #HEX`');
    await role.setColor(hex);
    return message.reply(`🎨 Rol rengi güncellendi.`);
  }

  // -------------------------------------------------------------
  // 🔊 31-40: SES KANALI KOMUTLARI
  // -------------------------------------------------------------
  if (command === 'voice-kick') {
    if (!member.permissions.has(PermissionFlagsBits.MoveMembers)) return message.reply('❌ Yetkiniz yok.');
    const target = message.mentions.members.first();
    if (!target || !target.voice.channel) return message.reply('❌ Kullanıcı seste değil.');
    await target.voice.disconnect();
    return message.reply('🔌 Sesten atıldı.');
  }

  if (command === 'voice-mute') {
    if (!member.permissions.has(PermissionFlagsBits.MuteMembers)) return message.reply('❌ Yetkiniz yok.');
    const target = message.mentions.members.first();
    if (!target || !target.voice.channel) return message.reply('❌ Kullanıcı seste değil.');
    await target.voice.setMute(true);
    return message.reply('🎙️ Seste susturuldu.');
  }

  if (command === 'voice-unmute') {
    if (!member.permissions.has(PermissionFlagsBits.MuteMembers)) return message.reply('❌ Yetkiniz yok.');
    const target = message.mentions.members.first();
    if (!target || !target.voice.channel) return message.reply('❌ Kullanıcı seste değil.');
    await target.voice.setMute(false);
    return message.reply('🎙️ Susturma kaldırıldı.');
  }

  if (command === 'voice-deaf') {
    if (!member.permissions.has(PermissionFlagsBits.DeafenMembers)) return message.reply('❌ Yetkiniz yok.');
    const target = message.mentions.members.first();
    if (!target || !target.voice.channel) return message.reply('❌ Kullanıcı seste değil.');
    await target.voice.setDeaf(true);
    return message.reply('🎧 Sağırlaştırıldı.');
  }

  if (command === 'voice-undeaf') {
    if (!member.permissions.has(PermissionFlagsBits.DeafenMembers)) return message.reply('❌ Yetkiniz yok.');
    const target = message.mentions.members.first();
    if (!target || !target.voice.channel) return message.reply('❌ Kullanıcı seste değil.');
    await target.voice.setDeaf(false);
    return message.reply('🎧 Sağırlaştırma kaldırıldı.');
  }

  if (command === 'voice-move') {
    if (!member.permissions.has(PermissionFlagsBits.MoveMembers)) return message.reply('❌ Yetkiniz yok.');
    const target = message.mentions.members.first();
    const chanId = args[1];
    if (!target || !chanId) return message.reply('❌ Kullanım: `.voice-move @kullanıcı [Kanal_ID]`');
    await target.voice.setChannel(chanId);
    return message.reply('🔊 Kullanıcı taşındı.');
  }

  if (command === 'voice-disconnect') {
    if (!member.permissions.has(PermissionFlagsBits.MoveMembers)) return message.reply('❌ Yetkiniz yok.');
    const target = message.mentions.members.first();
    if (!target || !target.voice.channel) return message.reply('❌ Seste değil.');
    await target.voice.disconnect();
    return message.reply('🔌 Bağlantı kesildi.');
  }

  if (command === 'voice-lock') {
    if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) return message.reply('❌ Yetkiniz yok.');
    const chan = member.voice.channel;
    if (!chan) return message.reply('❌ Bir ses kanalında olmalısınız.');
    await chan.permissionOverwrites.edit(guild.roles.everyone, { Connect: false });
    return message.reply('🔒 Ses kanalı kilitlendi.');
  }

  if (command === 'voice-unlock') {
    if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) return message.reply('❌ Yetkiniz yok.');
    const chan = member.voice.channel;
    if (!chan) return message.reply('❌ Bir ses kanalında olmalısınız.');
    await chan.permissionOverwrites.edit(guild.roles.everyone, { Connect: true });
    return message.reply('🔓 Ses kanalı kilidi açıldı.');
  }

  if (command === 'voice-limit') {
    if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) return message.reply('❌ Yetkiniz yok.');
    const chan = member.voice.channel;
    const limit = parseInt(args[0]);
    if (!chan || isNaN(limit)) return message.reply('❌ Seste olun ve limit girin.');
    await chan.setUserLimit(limit);
    return message.reply(`👥 Limit ${limit} yapıldı.`);
  }

  // -------------------------------------------------------------
  // ⚙️ 41-50: SUNUCU, BİLGİ & SİSTEM KOMUTLARI
  // -------------------------------------------------------------
  if (command === 'server-info' || command === 'sunucu-bilgi') {
    const embed = new EmbedBuilder().setTitle(`🏰 ${guild.name}`).addFields({ name: 'Üye', value: `${guild.memberCount}`, inline: true }, { name: 'Kanal', value: `${guild.channels.cache.size}`, inline: true });
    return message.reply({ embeds: [embed] });
  }

  if (command === 'user-info' || command === 'kullanıcı-bilgi') {
    const target = message.mentions.members.first() || member;
    const embed = new EmbedBuilder().setTitle(`👤 ${target.user.tag}`).addFields({ name: 'ID', value: target.id, inline: true });
    return message.reply({ embeds: [embed] });
  }

  if (command === 'avatar') {
    const target = message.mentions.users.first() || message.author;
    const embed = new EmbedBuilder().setTitle(`${target.tag} Avatar`).setImage(target.displayAvatarURL({ size: 1024 }));
    return message.reply({ embeds: [embed] });
  }

  if (command === 'banner') {
    const target = message.mentions.users.first() || message.author;
    const fetched = await client.users.fetch(target.id, { force: true });
    if (!fetched.banner) return message.reply('❌ Banner yok.');
    const embed = new EmbedBuilder().setImage(fetched.bannerURL({ size: 1024 }));
    return message.reply({ embeds: [embed] });
  }

  if (command === 'ping') {
    return message.reply(`🏓 Pong! ${client.ws.ping}ms`);
  }

  if (command === 'help' || command === 'yardım' || command === 'mod-help') {
    const embed = new EmbedBuilder()
      .setTitle('🛡️ 50 Komutluk Moderasyon Botu - Yardım Menüsü')
      .setDescription('Ön ekler: `.` veya `!`')
      .addFields(
        { name: '👥 Ceza & Moderasyon (1-10)', value: '`kick`, `ban`, `unban`, `mute` (`timeout`), `unmute`, `softban`, `warn`, `tempban`, `forceban`, `jail`' },
        { name: '🧹 Temizlik & Kanal (11-20)', value: '`clear` (`sil`), `clearuser`, `clearbots`, `nuke`, `lock`, `unlock`, `slowmode`, `slowmode-off`, `clearemojis`, `clearlinks`' },
        { name: '🛡️ Rol & Yetki (21-30)', value: '`role-add` (`rol-ver`), `role-remove` (`rol-al`), `role-all`, `role-remove-all`, `role-create`, `role-delete`, `role-info`, `nick`, `reset-nick`, `role-color`' },
        { name: '🔊 Ses Yönetimi (31-40)', value: '`voice-kick`, `voice-mute`, `voice-unmute`, `voice-deaf`, `voice-undeaf`, `voice-move`, `voice-disconnect`, `voice-lock`, `voice-unlock`, `voice-limit`' },
        { name: '⚙️ Sunucu & Sistem (41-50)', value: '`server-info`, `user-info`, `avatar`, `banner`, `ping`, `help` (`yardım`), `bot-info`, `bans-list`, `invites`, `slowmode-reset`' }
      )
      .setColor('#5865F2');
    return message.reply({ embeds: [embed] });
  }

  if (command === 'bot-info') {
    return message.reply(`🤖 Çalışma süresi: ${Math.floor(client.uptime / 60000)} dakika`);
  }

  if (command === 'bans-list') {
    if (!member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ Yetkiniz yok.');
    const bans = await guild.bans.fetch();
    const list = bans.map(b => b.user.tag).join(', ') || 'Yok';
    return message.reply(`⛔ Banlılar: ${list.slice(0, 1900)}`);
  }

  if (command === 'invites') {
    const invites = await guild.invites.fetch();
    let count = 0;
    invites.filter(i => i.inviter?.id === message.author.id).forEach(i => count += i.uses);
    return message.reply(`✉️ Davet sayınız: ${count}`);
  }

  if (command === 'slowmode-reset') {
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('❌ Yetkiniz yok.');
    guild.channels.cache.forEach(c => { if (c.isTextBased()) c.setRateLimitPerUser(0).catch(() => {}); });
    return message.reply('⚙️ Tüm kanallarda slowmode sıfırlandı.');
  }

});

client.login(TOKEN);