const { SlashCommandBuilder } = require("discord.js");
const {
  getCombinedRankProfile,
  getUserRankPosition,
  resolveLevelFromXp,
} = require("../../modules/progression/ranking");
const { infoEmbed } = require("../../utils/embeds");
const { formatDuration } = require("../../utils/time");

function progressBar(current, total, size = 12) {
  const safeTotal = Math.max(1, total || 1);
  const filled = Math.max(0, Math.min(size, Math.round((current / safeTotal) * size)));
  return `${"=".repeat(filled)}${".".repeat(Math.max(0, size - filled))}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank-kart")
    .setDescription("Gorsel hissi veren detayli rank karti gosterir.")
    .addUserOption((option) =>
      option.setName("uye").setDescription("Kart gosterilecek uye").setRequired(false),
    ),
  async execute(client, interaction) {
    const user = interaction.options.getUser("uye") || interaction.user;
    const profile = getCombinedRankProfile(interaction.guildId, user.id);
    const chatState = resolveLevelFromXp(profile.message.xp);
    const voiceState = resolveLevelFromXp(profile.voice.xp);
    const chatRank = getUserRankPosition(interaction.guildId, user.id, "chat");
    const voiceRank = getUserRankPosition(interaction.guildId, user.id, "voice");

    await interaction.reply({
      embeds: [
        infoEmbed(
          `${user.username} Bocchi Karti`,
          [
            `Chat L${profile.message.level}  #${chatRank || "-"}  ${progressBar(chatState.currentLevelXp, chatState.neededXp)}`,
            `XP: ${profile.message.xp} / Sonraki: ${chatState.neededXp}`,
            `Mesaj: ${profile.message.messageCount}`,
            "",
            `Ses L${profile.voice.level}  #${voiceRank || "-"}  ${progressBar(voiceState.currentLevelXp, voiceState.neededXp)}`,
            `XP: ${profile.voice.xp} / Sonraki: ${voiceState.neededXp}`,
            `Aktif Ses: ${formatDuration(profile.voice.activeSeconds * 1000)}`,
            `Deafen: ${formatDuration(profile.voice.deafenedSeconds * 1000)}`,
            "",
            `Partner Puan: ${profile.partner.score} | Davet: ${profile.invites}`,
          ].join("\n"),
        ),
      ],
      ephemeral: true,
    });
  },
};
