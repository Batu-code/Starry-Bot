const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getSnapshot, restoreSnapshot } = require("../../modules/security/snapshots");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("snapshot-yukle")
    .setDescription("Kaydedilmis bir snapshot'i geri yuklemeyi dener.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option.setName("kod").setDescription("Snapshot kodu").setRequired(true),
    ),
  async execute(client, interaction) {
    const id = interaction.options.getString("kod", true);
    const snapshot = getSnapshot(interaction.guildId, id);
    if (!snapshot) {
      throw new Error("Snapshot bulunamadi.");
    }

    await restoreSnapshot(interaction.guild, snapshot);
    await interaction.reply({
      embeds: [successEmbed("Snapshot Yuklendi", `**${id}** snapshot'i geri yukleme islemine alindi.`)],
      ephemeral: true,
    });
  },
};
