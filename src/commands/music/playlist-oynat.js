const { SlashCommandBuilder } = require("discord.js");
const { getGuildConfig } = require("../../data/store");
const { ensureQueue, searchTrack, enqueueTracks } = require("../../modules/music/player");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playlist-oynat")
    .setDescription("Kaydedilen playlisti kuyruga ekler.")
    .addStringOption((option) =>
      option.setName("isim").setDescription("Playlist adi").setRequired(true),
    ),
  async execute(client, interaction) {
    await interaction.deferReply();
    const name = interaction.options.getString("isim", true).toLowerCase();
    const playlists = getGuildConfig(interaction.guildId).music.savedPlaylists || {};
    const items = playlists[name];

    if (!items?.length) {
      throw new Error("Bu isimde playlist yok.");
    }

    const queue = await ensureQueue(interaction);
    const tracks = [];
    for (const item of items) {
      const result = await searchTrack(client.player, item.url || item.title, interaction.user);
      const track = result.tracks[0];
      if (track) {
        tracks.push(track);
      }
    }

    enqueueTracks(queue, tracks);

    if (!queue.isPlaying()) {
      await queue.node.play();
    }

    await interaction.editReply({
      embeds: [successEmbed("Playlist Kuyruga Eklendi", `**${name}** listesi oynatiliyor.`)],
    });
  },
};
