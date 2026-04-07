const { SlashCommandBuilder } = require("discord.js");
const { getGuildConfig, patchGuildConfig } = require("../../data/store");
const { successEmbed } = require("../../utils/embeds");
const { assertVoiceAccess } = require("../../modules/music/guards");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playlist-kaydet")
    .setDescription("Mevcut kuyrugu kaydeder.")
    .addStringOption((option) =>
      option.setName("isim").setDescription("Playlist adi").setRequired(true),
    ),
  async execute(client, interaction) {
    const queue = client.player.nodes.get(interaction.guildId);
    if (!queue?.currentTrack) {
      throw new Error("Kaydedilecek aktif kuyruk yok.");
    }

    assertVoiceAccess(interaction, queue);
    const name = interaction.options.getString("isim", true).toLowerCase();
    const guildConfig = getGuildConfig(interaction.guildId);

    const tracks = [queue.currentTrack, ...queue.tracks.toArray()].map((track) => ({
      title: track.title,
      url: track.url,
    }));

    patchGuildConfig(interaction.guildId, {
      music: {
        savedPlaylists: {
          ...guildConfig.music.savedPlaylists,
          [name]: tracks,
        },
      },
    });

    await interaction.reply({
      embeds: [successEmbed("Playlist Kaydedildi", `**${name}** listesine ${tracks.length} parca kaydedildi.`)],
      ephemeral: true,
    });
  },
};

