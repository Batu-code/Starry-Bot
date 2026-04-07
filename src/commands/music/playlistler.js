const { SlashCommandBuilder } = require("discord.js");
const { getGuildConfig } = require("../../data/store");
const { infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playlistler")
    .setDescription("Kaydedilen muzik listelerini gosterir."),
  async execute(client, interaction) {
    const playlists = getGuildConfig(interaction.guildId).music.savedPlaylists || {};
    const entries = Object.entries(playlists);

    await interaction.reply({
      embeds: [
        infoEmbed(
          "Kayitli Playlistler",
          entries.length
            ? entries.map(([name, tracks]) => `**${name}** - ${tracks.length} parca`).join("\n")
            : "Kayitli playlist yok.",
        ),
      ],
      ephemeral: true,
    });
  },
};

