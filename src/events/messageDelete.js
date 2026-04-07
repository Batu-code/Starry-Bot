const { sendLog } = require("../modules/logging/sendLog");
const { COLORS } = require("../constants");

module.exports = {
  name: "messageDelete",
  async execute(client, message) {
    if (!message.guild || message.author?.bot) {
      return;
    }

    await sendLog(message.guild, {
      color: COLORS.warning,
      title: "Mesaj Silindi",
      description: `${message.author?.tag || "Bilinmeyen kullanici"} tarafindan gonderilen bir mesaj silindi.`,
      fields: [
        { name: "Kanal", value: `${message.channel}`, inline: true },
        { name: "Icerik", value: (message.content || "Yok").slice(0, 1024), inline: false },
      ],
    });
  },
};

