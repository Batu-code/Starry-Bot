const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { createSnapshot } = require("../../modules/security/snapshots");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("snapshot-al")
    .setDescription("Sunucunun daha detayli bir snapshot kaydini alir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(client, interaction) {
    const snapshot = await createSnapshot(interaction.guild);
    await interaction.reply({
      embeds: [successEmbed("Snapshot Alindi", `Snapshot kodu: **${snapshot.id}**`)],
      ephemeral: true,
    });
  },
};
