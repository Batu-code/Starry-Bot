const { SlashCommandBuilder } = require("discord.js");
const { infoEmbed } = require("../../utils/embeds");
const { assertVoiceAccess } = require("../../modules/music/guards");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kuyruk")
    .setDescription("Muzik kuyrugunu gosterir."),
  async execute(client, interaction) {
    const queue = client.player.nodes.get(interaction.guildId);
    if (!queue?.currentTrack) {
      throw new Error("Bos kuyruk.");
    }

    assertVoiceAccess(interaction, queue);
    const lines = queue.tracks.toArray().slice(0, 10).map((track, index) => `${index + 1}. ${track.title}`);
    const description = [
      `Simdi: **${queue.currentTrack.title}**`,
      "",
      lines.length ? lines.join("\n") : "Sirada baska sarki yok.",
    ].join("\n");

    await interaction.reply({
      embeds: [infoEmbed("Muzik Kuyrugu", description)],
      ephemeral: true,
    });
  },
};
