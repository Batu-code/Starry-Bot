const { SlashCommandBuilder } = require("discord.js");
const { buildHelpEmbed } = require("../../modules/community/help");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yardim")
    .setDescription("Botun tum Turkce komutlarini gosterir."),
  async execute(client, interaction) {
    await interaction.reply({
      embeds: [buildHelpEmbed()],
      ephemeral: true,
    });
  },
};

