const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getGuildConfig } = require("../../data/store");
const { buildModeratorAudit } = require("../../modules/security/moderatorAudit");
const { listSnapshots } = require("../../modules/security/snapshots");
const { infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("guvenlik-raporu")
    .setDescription("Sunucunun guvenlik durumunu tek ozet ekranda gosterir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(client, interaction) {
    const config = getGuildConfig(interaction.guildId);
    const audit = buildModeratorAudit(interaction.guildId);
    const riskEntries = Object.entries(config.security.risk.scores || {})
      .sort((a, b) => (b[1]?.score || 0) - (a[1]?.score || 0))
      .slice(0, 5);
    const snapshots = listSnapshots().filter((entry) => entry.guildId === interaction.guildId);

    const topRiskText = riskEntries.length
      ? riskEntries.map(([userId, entry]) => `<@${userId}>: ${entry.score}`).join("\n")
      : "Risk kaydi yok.";

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
            "",
            "**En riskli uyeler**",
            topRiskText,
          ].join("\n"),
        ),
      ],
      ephemeral: true,
    });
  },
};
