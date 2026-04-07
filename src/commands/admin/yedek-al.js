const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { createBackup } = require("../../modules/security/backups");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yedek-al")
    .setDescription("Sunucunun temel kanal ve rol yedegini alir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(client, interaction) {
    const backup = await createBackup(interaction.guild);
    await interaction.reply({ embeds: [successEmbed("Yedek Alindi", `Yedek kodu: **${backup.id}**`)], ephemeral: true });
  },
};

