const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getBackup, restoreBackup } = require("../../modules/security/backups");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yedek-yukle")
    .setDescription("Kaydedilen bir yedegi geri yuklemeyi dener.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) => option.setName("kod").setDescription("Yedek kodu").setRequired(true)),
  async execute(client, interaction) {
    const id = interaction.options.getString("kod", true);
    const backup = getBackup(id, interaction.guildId);
    if (!backup) throw new Error("Yedek bulunamadi.");
    await restoreBackup(interaction.guild, backup);
    await interaction.reply({ embeds: [successEmbed("Yedek Yuklendi", `**${id}** yedegi geri yukleme islemine alindi.`)], ephemeral: true });
  },
};

