const { SlashCommandBuilder } = require("discord.js");
const { successEmbed } = require("../../utils/embeds");
const { assertVoiceAccess, assertDjAccess } = require("../../modules/music/guards");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("durdur")
    .setDescription("Kuyrugu temizler ve muzigi durdurur."),
  async execute(client, interaction) {
    const queue = client.player.nodes.get(interaction.guildId);
    if (!queue) {
      throw new Error("Aktif muzik yok.");
    }

    assertVoiceAccess(interaction, queue);
    assertDjAccess(interaction);
    queue.delete();
    await interaction.reply({
      embeds: [successEmbed("Muzik Durduruldu", "Kuyruk temizlendi ve oynatici kapatildi.")],
      ephemeral: true,
    });
  },
};
