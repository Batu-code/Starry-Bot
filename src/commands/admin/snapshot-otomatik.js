const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { patchGuildConfig } = require("../../data/store");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("snapshot-otomatik")
    .setDescription("Otomatik snapshot olusturmayi ayarlar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption((option) =>
      option.setName("aktif").setDescription("Otomatik snapshot acik mi").setRequired(true),
    )
    .addIntegerOption((option) =>
      option.setName("saat").setDescription("Kac saatte bir olussun").setMinValue(1).setRequired(false),
    ),
  async execute(client, interaction) {
    const enabled = interaction.options.getBoolean("aktif", true);
    const hours = interaction.options.getInteger("saat");

    patchGuildConfig(interaction.guildId, {
      security: {
        snapshots: {
          autoCreateEnabled: enabled,
          autoCreateIntervalHours: hours ?? undefined,
        },
      },
    });

    await interaction.reply({
      embeds: [successEmbed("Otomatik Snapshot Guncellendi", "Yeni zamanlama kaydedildi.")],
      ephemeral: true,
    });
  },
};
