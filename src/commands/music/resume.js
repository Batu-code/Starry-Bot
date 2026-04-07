const { SlashCommandBuilder } = require("discord.js");
const { successEmbed } = require("../../utils/embeds");
const { assertVoiceAccess, assertDjAccess } = require("../../modules/music/guards");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("devam")
    .setDescription("Duraklatilan muzigi devam ettirir."),
  async execute(client, interaction) {
    const queue = client.player.nodes.get(interaction.guildId);
    if (!queue) {
      throw new Error("Aktif muzik oturumu yok.");
    }

    assertVoiceAccess(interaction, queue);
    assertDjAccess(interaction);
    queue.node.resume();
    await interaction.reply({
      embeds: [successEmbed("Devam Ediyor", "Muzik yeniden baslatildi.")],
      ephemeral: true,
    });
  },
};
