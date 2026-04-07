const { SlashCommandBuilder } = require("discord.js");
const { getGuildConfig, patchGuildConfig } = require("../../data/store");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("favori-ekle")
    .setDescription("Calan sarkiyi favorilerine kaydeder."),
  async execute(client, interaction) {
    const queue = client.player.nodes.get(interaction.guildId);
    if (!queue?.currentTrack) {
      throw new Error("Calan sarki yok.");
    }

    const config = getGuildConfig(interaction.guildId);
    const current = config.music.favoriteTracks[interaction.user.id] || [];
    const next = [...current, { title: queue.currentTrack.title, url: queue.currentTrack.url }].slice(-20);

    patchGuildConfig(interaction.guildId, {
      music: {
        favoriteTracks: {
          ...config.music.favoriteTracks,
          [interaction.user.id]: next,
        },
      },
    });

    await interaction.reply({
      embeds: [successEmbed("Favorilere Eklendi", queue.currentTrack.title)],
      ephemeral: true,
    });
  },
};

