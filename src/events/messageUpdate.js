const { sendLog } = require("../modules/logging/sendLog");
const { COLORS } = require("../constants");

module.exports = {
  name: "messageUpdate",
  async execute(client, oldMessage, newMessage) {
    if (!newMessage.guild || newMessage.author?.bot || oldMessage.content === newMessage.content) {
      return;
    }

    await sendLog(newMessage.guild, {
      color: COLORS.primary,
      title: "Mesaj Duzenlendi",
      description: `${newMessage.author.tag} bir mesajini duzenledi.`,
      fields: [
        { name: "Eski", value: (oldMessage.content || "Yok").slice(0, 1024), inline: false },
        { name: "Yeni", value: (newMessage.content || "Yok").slice(0, 1024), inline: false },
      ],
    });
  },
};

