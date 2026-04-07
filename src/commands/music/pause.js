const { SlashCommandBuilder } = require("discord.js");
const { successEmbed } = require("../../utils/embeds");
const { assertVoiceAccess, assertDjAccess } = require("../../modules/music/guards");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("duraklat")
    .setDescription("Muzigi duraklatir."),
  async execute(client, interaction) {
    const queue = client.player.nodes.get(interaction.guildId);
    if (!queue?.isPlaying()) {
      throw new Error("Calan muzik yok.");
    }

    assertVoiceAccess(interaction, queue);
    assertDjAccess(interaction);
    queue.node.pause();
    await interaction.reply({
      embeds: [successEmbed("Duraklatildi", "Muzik duraklatildi.")],
      ephemeral: true,
    });
  },
};
