const { SlashCommandBuilder } = require("discord.js");
const { getGuildConfig } = require("../../data/store");
const { infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("favoriler")
    .setDescription("Kayitli favori sarkilarini listeler."),
  async execute(client, interaction) {
    const items = getGuildConfig(interaction.guildId).music.favoriteTracks[interaction.user.id] || [];
    const text = items.length
      ? items.map((item, index) => `${index + 1}. ${item.title}`).join("\n")
      : "Favori sarki yok.";

    await interaction.reply({
      embeds: [infoEmbed("Favori Sarkilar", text)],
      ephemeral: true,
    });
  },
};

