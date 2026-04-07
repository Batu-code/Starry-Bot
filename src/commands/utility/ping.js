const { SlashCommandBuilder } = require("discord.js");
const { infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gecikme")
    .setDescription("Bot gecikmesini gosterir."),
  async execute(client, interaction) {
    await interaction.reply({
      embeds: [infoEmbed("Pong", `WebSocket gecikmesi: ${client.ws.ping}ms`)],
      ephemeral: true,
    });
  },
};
