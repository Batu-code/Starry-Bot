const { SlashCommandBuilder } = require("discord.js");
const { getInventory } = require("../../modules/economy/system");
const { infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("envanter")
    .setDescription("Envanterini gosterir."),
  async execute(client, interaction) {
    const items = getInventory(interaction.guildId, interaction.user.id);
    await interaction.reply({ embeds: [infoEmbed("Envanter", items.length ? items.join("\n") : "Envanterin bos.")], ephemeral: true });
  },
};

