const { sendLog } = require("../modules/logging/sendLog");
const { COLORS } = require("../constants");

module.exports = {
  name: "channelUpdate",
  async execute(client, oldChannel, newChannel) {
    if (!newChannel.guild) {
      return;
    }

    const changes = [];
    if (oldChannel.name !== newChannel.name) {
      changes.push(`Isim: ${oldChannel.name} -> ${newChannel.name}`);
    }

    if ("topic" in oldChannel && oldChannel.topic !== newChannel.topic) {
      changes.push(`Konu guncellendi`);
    }

    if (!changes.length) {
      return;
    }

    await sendLog(newChannel.guild, {
      color: COLORS.primary,
      title: "Kanal Guncellendi",
      description: `${newChannel} icin degisiklik algilandi.`,
      fields: [{ name: "Degisiklikler", value: changes.join("\n").slice(0, 1024), inline: false }],
    });
  },
};

