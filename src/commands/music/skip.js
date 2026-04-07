const { SlashCommandBuilder } = require("discord.js");
const { successEmbed } = require("../../utils/embeds");
const { assertVoiceAccess, assertDjAccess } = require("../../modules/music/guards");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gec")
    .setDescription("Siradaki sarkiya gecer."),
  async execute(client, interaction) {
    const queue = client.player.nodes.get(interaction.guildId);
    if (!queue?.currentTrack) {
      throw new Error("Aktif sarki yok.");
    }

    assertVoiceAccess(interaction, queue);
    assertDjAccess(interaction);
    queue.node.skip();

    await interaction.reply({
      embeds: [successEmbed("Gecildi", "Siradaki sarkiya geciliyor.")],
      ephemeral: true,
    });
  },
};
