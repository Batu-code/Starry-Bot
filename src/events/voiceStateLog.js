const { sendLog } = require("../modules/logging/sendLog");
const { COLORS } = require("../constants");

module.exports = {
  name: "voiceStateUpdate",
  async execute(client, oldState, newState) {
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) {
      return;
    }

    if (oldState.channelId === newState.channelId) {
      return;
    }

    await sendLog(member.guild, {
      color: COLORS.muted,
      title: "Ses Hareketi",
      description: `${member.user.tag} ses kanali degistirdi.`,
      fields: [
        { name: "Eski", value: oldState.channel ? oldState.channel.name : "Yok", inline: true },
        { name: "Yeni", value: newState.channel ? newState.channel.name : "Yok", inline: true },
      ],
    });
  },
};
