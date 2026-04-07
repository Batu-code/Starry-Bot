const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { listBackups } = require("../../modules/security/backups");
const { infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yedekler")
    .setDescription("Kayitli yedekleri listeler.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(client, interaction) {
    const backups = listBackups().filter((entry) => entry.guildId === interaction.guildId).slice(0, 10);
    const text = backups.length
      ? backups.map((entry) => `**${entry.id}** - <t:${Math.floor(entry.createdAt / 1000)}:R>`).join("\n")
      : "Kayitli yedek yok.";
    await interaction.reply({ embeds: [infoEmbed("Sunucu Yedekleri", text)], ephemeral: true });
  },
};

