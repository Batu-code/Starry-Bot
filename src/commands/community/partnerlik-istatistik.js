const { SlashCommandBuilder } = require("discord.js");
const { getGuildConfig } = require("../../data/store");
const { infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("partnerlik-istatistik")
    .setDescription("Partnerlik sistemi ozetini gosterir."),
  async execute(client, interaction) {
    const settings = getGuildConfig(interaction.guildId).community.partnership;
    const partnerCount = settings.partners?.length || 0;
    const pendingCount = Object.values(settings.applicants || {}).filter(
      (entry) => entry.status === "pending",
    ).length;

    const latest = (settings.partners || [])
      .slice(-5)
      .reverse()
      .map((entry) => `**${entry.serverName}** - <t:${Math.floor(entry.approvedAt / 1000)}:R>`)
      .join("\n") || "Kayitli partner yok.";

    await interaction.reply({
      embeds: [
        infoEmbed(
          "Partnerlik Istatistikleri",
          [
            `Toplam partner: **${partnerCount}**`,
            `Bekleyen basvuru: **${pendingCount}**`,
            "",
            "**Son partnerler**",
            latest,
          ].join("\n"),
        ),
      ],
      ephemeral: true,
    });
  },
};

