const { SlashCommandBuilder } = require("discord.js");
const { infoEmbed } = require("../../utils/embeds");
const { assertVoiceAccess } = require("../../modules/music/guards");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("simdicalan")
    .setDescription("Calan sarkiyi gosterir."),
  async execute(client, interaction) {
    const queue = client.player.nodes.get(interaction.guildId);
    if (!queue?.currentTrack) {
      throw new Error("Calan sarki yok.");
    }

    assertVoiceAccess(interaction, queue);
    await interaction.reply({
      embeds: [infoEmbed("Simdi Caliyor", `**${queue.currentTrack.title}**\n${queue.currentTrack.url}`)],
      ephemeral: true,
    });
  },
};
