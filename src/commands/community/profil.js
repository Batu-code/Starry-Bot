const { SlashCommandBuilder } = require("discord.js");
const { getGuildConfig } = require("../../data/store");
const { getProfile } = require("../../modules/progression/profiles");
const { getCombinedRankProfile } = require("../../modules/progression/ranking");
const { infoEmbed } = require("../../utils/embeds");
const { formatDuration } = require("../../utils/time");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profil")
    .setDescription("Kullanici profilini gosterir.")
    .addUserOption((option) => option.setName("uye").setDescription("Bakilacak uye").setRequired(false)),
  async execute(client, interaction) {
    const user = interaction.options.getUser("uye") || interaction.user;
    const config = getGuildConfig(interaction.guildId);
    const invites = config.stats.invites[user.id] || 0;
    const profile = getProfile(interaction.guildId, user.id);
    const rankProfile = getCombinedRankProfile(interaction.guildId, user.id);
    await interaction.reply({
      embeds: [
        infoEmbed(
          `${user.username} profili`,
          [
            `Chat seviye: **${rankProfile.message.level}**`,
            `Chat XP: **${rankProfile.message.xp}**`,
            `Mesaj: **${rankProfile.message.messageCount}**`,
            `Ses seviye: **${rankProfile.voice.level}**`,
            `Aktif ses: **${formatDuration(rankProfile.voice.activeSeconds * 1000)}**`,
            `Deafen: **${formatDuration(rankProfile.voice.deafenedSeconds * 1000)}**`,
            `Partner puani: **${rankProfile.partner.score}**`,
            `Davet: **${invites}**`,
            `Rozet: ${profile.badges.length ? profile.badges.join(", ") : "Yok"}`,
            `Bio: ${profile.bio || "Yok"}`,
          ].join("\n"),
        ),
      ],
      ephemeral: true,
    });
  },
};
