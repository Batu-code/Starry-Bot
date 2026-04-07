const { cacheGuildInvites } = require("../modules/security/inviteTracker");
const { sendLog } = require("../modules/logging/sendLog");
const { COLORS } = require("../constants");

module.exports = {
  name: "inviteDelete",
  async execute(client, invite) {
    await cacheGuildInvites(invite.guild).catch(() => null);
    await sendLog(invite.guild, {
      color: COLORS.warning,
      title: "Davet Silindi",
      description: `${invite.code} daveti silindi.`,
    });
  },
};

