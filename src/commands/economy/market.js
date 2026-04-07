const { SlashCommandBuilder } = require("discord.js");
const { getGuildConfig } = require("../../data/store");
const { infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("market")
    .setDescription("Marketteki urunleri listeler."),
  async execute(client, interaction) {
    const items = getGuildConfig(interaction.guildId).economy.shop;
    await interaction.reply({ embeds: [infoEmbed("Market", items.map((item) => `**${item.id}** - ${item.name} - ${item.price} coin`).join("\n"))], ephemeral: true });
  },
};

