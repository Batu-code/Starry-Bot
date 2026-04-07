const { SlashCommandBuilder } = require("discord.js");
const { successEmbed } = require("../../utils/embeds");
const { assertVoiceAccess, assertDjAccess } = require("../../modules/music/guards");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ses")
    .setDescription("Muzik ses seviyesini ayarlar.")
    .addIntegerOption((option) =>
      option
        .setName("deger")
        .setDescription("10-100")
        .setMinValue(10)
        .setMaxValue(100)
        .setRequired(true),
    ),
  async execute(client, interaction) {
    const volume = interaction.options.getInteger("deger", true);
    const queue = client.player.nodes.get(interaction.guildId);
    if (!queue) {
      throw new Error("Aktif oynatici yok.");
    }

    assertVoiceAccess(interaction, queue);
    assertDjAccess(interaction);
    queue.node.setVolume(volume);
    await interaction.reply({
      embeds: [successEmbed("Ses Guncellendi", `Yeni ses seviyesi: **${volume}**`)],
      ephemeral: true,
    });
  },
};
