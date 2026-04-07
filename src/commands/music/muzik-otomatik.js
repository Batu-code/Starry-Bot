const { SlashCommandBuilder } = require("discord.js");
const { patchGuildConfig, getGuildConfig } = require("../../data/store");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("muzik-otomatik")
    .setDescription("Muzikte otomatik devam modunu acar veya kapatir.")
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
        autoplay: state,
      },
    });

    const queue = client.player.nodes.get(interaction.guildId);
    if (queue) {
      queue.setRepeatMode(queue.repeatMode);
    }

    const guildConfig = getGuildConfig(interaction.guildId);
    await interaction.reply({
      embeds: [successEmbed("Muzik Otomatik Modu", `Yeni durum: **${guildConfig.music.autoplay ? "acik" : "kapali"}**`)],
      ephemeral: true,
    });
  },
};

