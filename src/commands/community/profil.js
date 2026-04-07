const { SlashCommandBuilder } = require("discord.js");
const { getGuildConfig } = require("../../data/store");
const { getProfile } = require("../../modules/progression/profiles");
const { getBalance } = require("../../modules/economy/system");
const { infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profil")
    .setDescription("Kullanici profilini gosterir.")
    .addUserOption((option) => option.setName("uye").setDescription("Bakilacak uye").setRequired(false)),
  async execute(client, interaction) {
    const user = interaction.options.getUser("uye") || interaction.user;
    const config = getGuildConfig(interaction.guildId);
    const level = config.stats.messages[user.id]?.level || 0;
    const xp = config.stats.messages[user.id]?.xp || 0;
    const invites = config.stats.invites[user.id] || 0;
    const profile = getProfile(interaction.guildId, user.id);
    const balance = getBalance(interaction.guildId, user.id);
    await interaction.reply({
      embeds: [
        infoEmbed(
          `${user.username} profili`,
          [
            `Seviye: **${level}**`,
            `XP: **${xp}**`,
            `Davet: **${invites}**`,
            `Bakiye: **${balance}**`,
            `Rozet: ${profile.badges.length ? profile.badges.join(", ") : "Yok"}`,
            `Bio: ${profile.bio || "Yok"}`,
          ].join("\n"),
        ),
      ],
      ephemeral: true,
    });
  },
};

