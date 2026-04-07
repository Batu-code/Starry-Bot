const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { buildModeratorAudit, getModeratorTrustScore } = require("../../modules/security/moderatorAudit");
const { infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yetkili-denetim")
    .setDescription("Yetkili hareketlerini ve guven puanini ozetler.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((option) =>
      option.setName("uye").setDescription("Belirli bir moderatoru incele"),
    ),
  async execute(client, interaction) {
    const user = interaction.options.getUser("uye");

    if (user) {
      const report = getModeratorTrustScore(interaction.guildId, user.id);
      const byType = Object.entries(report.audit.byType)
        .map(([type, count]) => `${type}:${count}`)
        .join(", ") || "Kayit yok";

      await interaction.reply({
        embeds: [
          infoEmbed(
            "Yetkili Denetim",
            [
              `Yetkili: ${user}`,
              `Guven puani: **${report.score}/100**`,
              `Durum: **${report.level}**`,
              `Toplam kayit: **${report.audit.total}**`,
              `Turler: ${byType}`,
              `Son hareket: ${report.audit.lastIncidentAt ? `<t:${Math.floor(report.audit.lastIncidentAt / 1000)}:R>` : "Yok"}`,
            ].join("\n"),
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    const audit = buildModeratorAudit(interaction.guildId);
    const lines = Object.entries(audit.byModerator)
      .sort((a, b) => b[1].severity - a[1].severity)
      .slice(0, 10)
      .map(([moderatorId, data]) => `<@${moderatorId}> - ${data.total} kayit - risk ${data.severity}`)
      .join("\n") || "Kayit yok.";

    await interaction.reply({
      embeds: [
        infoEmbed(
          "Yetkili Denetim Ozeti",
          [
            `Toplam denetim kaydi: **${audit.total}**`,
            `Toplam risk agirligi: **${audit.totalSeverity}**`,
            "",
            lines,
          ].join("\n"),
        ),
      ],
      ephemeral: true,
    });
  },
};
