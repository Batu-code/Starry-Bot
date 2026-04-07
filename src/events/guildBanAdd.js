const { sendLog } = require("../modules/logging/sendLog");
const { COLORS } = require("../constants");

module.exports = {
  name: "guildBanAdd",
  async execute(client, ban) {
    await sendLog(ban.guild, {
      color: COLORS.danger,
      title: "Kullanici Yasaklandi",
      description: `${ban.user.tag} sunucudan banlandi.`,
    });
  },
};
