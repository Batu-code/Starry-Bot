const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { listSnapshots } = require("../../modules/security/snapshots");
const { infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("snapshotlar")
    .setDescription("Kayitli detayli snapshot listesini gosterir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(client, interaction) {
    const snapshots = listSnapshots()
      .filter((entry) => entry.guildId === interaction.guildId)
      .slice(0, 10);

    const text = snapshots.length
      ? snapshots.map((entry) => `**${entry.id}** - <t:${Math.floor(entry.createdAt / 1000)}:R>`).join("\n")
      : "Kayitli snapshot yok.";

    await interaction.reply({
      embeds: [infoEmbed("Snapshot Listesi", text)],
      ephemeral: true,
    });
  },
};
