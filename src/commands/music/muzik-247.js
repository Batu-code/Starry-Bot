const { SlashCommandBuilder } = require("discord.js");
const { patchGuildConfig, getGuildConfig } = require("../../data/store");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("muzik-247")
    .setDescription("7/24 muzik modunu acar veya kapatir.")
    .addStringOption((option) =>
      option
        .setName("durum")
        .setDescription("Yeni durum")
        .setRequired(true)
        .addChoices(
          { name: "Ac", value: "on" },
          { name: "Kapat", value: "off" },
        ),
    ),
  async execute(client, interaction) {
    const state = interaction.options.getString("durum", true) === "on";
    patchGuildConfig(interaction.guildId, {
      music: {
        alwaysOn: state,
      },
    });
    const current = getGuildConfig(interaction.guildId).music.alwaysOn;
    await interaction.reply({
      embeds: [successEmbed("24/7 Muzik", `Durum: **${current ? "acik" : "kapali"}**`)],
      ephemeral: true,
    });
  },
};
