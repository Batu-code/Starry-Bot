const { sendLog } = require("../modules/logging/sendLog");
const { COLORS } = require("../constants");

module.exports = {
  name: "guildMemberRemove",
  async execute(client, member) {
    await sendLog(member.guild, {
      color: COLORS.muted,
      title: "Uye Ayrildi",
      description: `${member.user.tag} sunucudan ayrildi.`,
    });
  },
};

