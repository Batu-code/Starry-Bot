const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getGuildConfig } = require("../../data/store");
const { buildModeratorAudit } = require("../../modules/security/moderatorAudit");
const { listSnapshots } = require("../../modules/security/snapshots");
const { auditBotPermissions } = require("../../modules/security/permissionAudit");
const { buildProdStatus } = require("../../modules/system/runtimeHealth");
const { infoEmbed } = require("../../utils/embeds");
const { formatDuration } = require("../../utils/time");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("guvenlik-raporu")
    .setDescription("Sunucunun guvenlik durumunu tek ozet ekranda gosterir.")
    .addBooleanOption((option) =>
      option.setName("detayli").setDescription("Izin problemlerini satir satir goster").setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(client, interaction) {
    const config = getGuildConfig(interaction.guildId);
    const audit = buildModeratorAudit(interaction.guildId);
    const permissionAudit = await auditBotPermissions(interaction.guild);
    const prod = buildProdStatus();
    const detailed = interaction.options.getBoolean("detayli") ?? false;
    const riskEntries = Object.entries(config.security.risk.scores || {})
      .sort((a, b) => (b[1]?.score || 0) - (a[1]?.score || 0))
      .slice(0, 5);
    const snapshots = listSnapshots().filter((entry) => entry.guildId === interaction.guildId);

    const topRiskText = riskEntries.length
      ? riskEntries.map(([userId, entry]) => `<@${userId}>: ${entry.score}`).join("\n")
      : "Risk kaydi yok.";
    const permissionText = permissionAudit.ok
      ? "Eksik izin tespit edilmedi."
      : permissionAudit.issues
        .slice(0, detailed ? 12 : 4)
        .map((issue) => `${issue.severity === "critical" ? "[Kritik]" : "[Uyari]"} ${issue.label}: ${issue.missingText}`)
        .join("\n");

    await interaction.reply({
      embeds: [
        infoEmbed(
          "Guvenlik Raporu",
          [
            `Anti-raid: **${config.security.antiRaid.enabled ? "acik" : "kapali"}**`,
            `Anti-spam: **${config.security.antiSpam.enabled ? "acik" : "kapali"}**`,
            `Anti-phishing: **${config.security.antiPhishing.enabled ? "acik" : "kapali"}**`,
            `Scam Shield: **${config.security.scamShield.enabled ? "acik" : "kapali"}**`,
            `Anti-nuke: **${config.security.antiNuke.enabled ? "acik" : "kapali"}**`,
            `Yetkili denetim: **${config.security.moderatorAudit.enabled ? "acik" : "kapali"}**`,
            `Trusted kullanici: **${config.security.trustedUserIds.length}**`,
            `Snapshot: **${snapshots.length}**`,
            `Denetim kaydi: **${audit.total}**`,
            `Izin problemi: **${permissionAudit.summary.critical} kritik / ${permissionAudit.summary.warning} uyari**`,
            `Prod durum: **${prod.status}**`,
            `Heartbeat yas: **${prod.ageMs !== null ? formatDuration(prod.ageMs) : "Yok"}**`,
            "",
            "**En riskli uyeler**",
            topRiskText,
            "",
            "**Izin Denetimi**",
            permissionText,
          ].join("\n"),
        ),
      ],
      ephemeral: true,
    });
  },
};
