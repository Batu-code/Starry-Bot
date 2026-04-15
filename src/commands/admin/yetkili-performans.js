const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getStaffEntry, getStaffLeaderboard } = require("../../modules/community/staffStats");
const { getCombinedRankProfile } = require("../../modules/progression/ranking");
const { infoEmbed } = require("../../utils/embeds");
const { formatDuration } = require("../../utils/time");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yetkili-performans")
    .setDescription("Yetkili performansini detayli gosterir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((option) =>
      option.setName("uye").setDescription("Belirli bir yetkiliyi incele").setRequired(false),
    ),
  async execute(client, interaction) {
    const user = interaction.options.getUser("uye");
    if (user) {
      const staff = getStaffEntry(interaction.guildId, user.id);
      const profile = getCombinedRankProfile(interaction.guildId, user.id);
      const actions = Object.entries(staff.actions || {})
        .map(([type, count]) => `${type}: ${count}`)
        .join("\n") || "Kayit yok.";

      await interaction.reply({
        embeds: [
          infoEmbed(
            "Yetkili Performansi",
            [
              `Yetkili: ${user}`,
              `Skor: **${staff.score || 0}**`,
              `Aktif ses: **${formatDuration(profile.voice.activeSeconds * 1000)}**`,
              `Chat seviye: **${profile.message.level}**`,
              "",
              actions,
            ].join("\n"),
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    const lines = getStaffLeaderboard(interaction.guildId, 10)
      .map(({ userId, entry }, index) => `#${index + 1} <@${userId}> - ${entry.score} puan`)
      .join("\n") || "Veri yok.";

    await interaction.reply({
      embeds: [infoEmbed("Yetkili Performans Leaderboard", lines)],
      ephemeral: true,
    });
  },
};
