const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getModeratorStats, getModerationSummary } = require("../../modules/moderation/cases");
const { getStaffLeaderboard } = require("../../modules/community/staffStats");
const { infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("moderator-raporu")
    .setDescription("Moderator eylem istatistiklerini ozetler.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(client, interaction) {
    const stats = getModeratorStats(interaction.guildId);
    const summary = getModerationSummary(interaction.guildId);
    const lines = Object.entries(stats)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .map(([moderatorId, data]) => `<@${moderatorId}> - ${data.total} islem`)
      .join("\n") || "Veri yok.";
    const staff = getStaffLeaderboard(interaction.guildId, 5)
      .map(({ userId, entry }) => `<@${userId}> - ${entry.score} puan`)
      .join("\n") || "Veri yok.";

    await interaction.reply({
      embeds: [
        infoEmbed(
          "Moderator Raporu",
          [
            `Toplam vaka: **${summary.total}**`,
            `Turler: ${Object.entries(summary.byType).map(([type, count]) => `${type}:${count}`).join(", ") || "Yok"}`,
            "",
            "**Moderasyon**",
            lines,
            "",
            "**Yetkili Skoru**",
            staff,
          ].join("\n"),
        ),
      ],
      ephemeral: true,
    });
  },
};
