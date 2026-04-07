const { cacheGuildInvites } = require("../modules/security/inviteTracker");
const { sendLog } = require("../modules/logging/sendLog");
const { COLORS } = require("../constants");

module.exports = {
  name: "inviteCreate",
  async execute(client, invite) {
    await cacheGuildInvites(invite.guild).catch(() => null);
    await sendLog(invite.guild, {
      color: COLORS.primary,
      title: "Davet Olusturuldu",
      description: `${invite.inviter?.tag || "Bilinmeyen"} yeni bir davet olusturdu.`,
      fields: [
        { name: "Kod", value: invite.code, inline: true },
        { name: "Kanal", value: `${invite.channel}`, inline: true },
      ],
    });
  },
};

