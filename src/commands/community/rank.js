const { SlashCommandBuilder } = require("discord.js");
const {
  getCombinedRankProfile,
  getUserRankPosition,
} = require("../../modules/progression/ranking");
const { infoEmbed } = require("../../utils/embeds");
const { formatDuration } = require("../../utils/time");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Chat, ses ve partner rank bilgilerini gosterir.")
    .addUserOption((option) =>
      option.setName("uye").setDescription("Rank bilgisi gosterilecek uye").setRequired(false),
    ),
  async execute(client, interaction) {
    const user = interaction.options.getUser("uye") || interaction.user;
    const profile = getCombinedRankProfile(interaction.guildId, user.id);
    const chatRank = getUserRankPosition(interaction.guildId, user.id, "chat");
    const voiceRank = getUserRankPosition(interaction.guildId, user.id, "voice");
    const partnerRank = getUserRankPosition(interaction.guildId, user.id, "partner");

    await interaction.reply({
      embeds: [
        infoEmbed(
          `${user.username} rank karti`,
          [
            `Chat seviye: **${profile.message.level}**`,
            `Chat XP: **${profile.message.xp}**`,
            `Chat sirasi: **#${chatRank || "-"}**`,
            `Mesaj sayisi: **${profile.message.messageCount}**`,
            "",
            `Ses seviye: **${profile.voice.level}**`,
            `Ses XP: **${profile.voice.xp}**`,
            `Ses sirasi: **#${voiceRank || "-"}**`,
            `Aktif ses: **${formatDuration(profile.voice.activeSeconds * 1000)}**`,
            `Deafen suresi: **${formatDuration(profile.voice.deafenedSeconds * 1000)}**`,
            "",
            `Partner puani: **${profile.partner.score}**`,
            `Partner sirasi: **#${partnerRank || "-"}**`,
            `Davet: **${profile.invites}**`,
          ].join("\n"),
        ),
      ],
      ephemeral: true,
    });
  },
};
