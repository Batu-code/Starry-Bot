const { SlashCommandBuilder } = require("discord.js");
const { getGuildConfig } = require("../../data/store");
const { ensureQueue, searchTrack, enqueueTracks } = require("../../modules/music/player");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("favori-oynat")
    .setDescription("Favorilerinden bir sarkiyi oynatir.")
    .addIntegerOption((option) =>
      option.setName("sira").setDescription("Favori numarasi").setRequired(true).setMinValue(1),
    ),
  async execute(client, interaction) {
    await interaction.deferReply();
    const index = interaction.options.getInteger("sira", true) - 1;
    const items = getGuildConfig(interaction.guildId).music.favoriteTracks[interaction.user.id] || [];
    const item = items[index];

    if (!item) {
      throw new Error("Favori bulunamadi.");
    }

    const queue = await ensureQueue(interaction);
    const result = await searchTrack(client.player, item.url || item.title, interaction.user);
    enqueueTracks(queue, [result.tracks[0]]);

    if (!queue.isPlaying()) {
      await queue.node.play();
    }

    await interaction.editReply({
      embeds: [successEmbed("Favori Oynatiliyor", item.title)],
    });
  },
};
