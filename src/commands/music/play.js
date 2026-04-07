const { SlashCommandBuilder } = require("discord.js");
const { ensureQueue, searchTrack, enqueueTracks } = require("../../modules/music/player");
const { successEmbed } = require("../../utils/embeds");
const { getGuildConfig } = require("../../data/store");
const { assertVoiceAccess } = require("../../modules/music/guards");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("oynat")
    .setDescription("Sarki veya playlist oynatir.")
    .addStringOption((option) =>
      option.setName("sorgu").setDescription("Sarki adi veya baglanti").setRequired(true),
    ),
  async execute(client, interaction) {
    await interaction.deferReply();
    const query = interaction.options.getString("sorgu", true);
    const queue = await ensureQueue(interaction);
    assertVoiceAccess(interaction, queue);
    const result = await searchTrack(client.player, query, interaction.user);
    const guildConfig = getGuildConfig(interaction.guildId);

    if (queue.tracks.size + result.tracks.length > guildConfig.music.maxQueueSize) {
      throw new Error("Kuyruk limiti asiliyor.");
    }

    enqueueTracks(queue, result.playlist ? result.tracks : [result.tracks[0]]);

    if (!queue.isPlaying()) {
      await queue.node.play();
    }

    await interaction.editReply({
      embeds: [
        successEmbed(
          "Muzik Kuyruga Eklendi",
          result.playlist
            ? `${result.tracks.length} parcalik playlist eklendi.`
            : `**${result.tracks[0].title}** kuyruga eklendi.`,
        ),
      ],
    });
  },
};
