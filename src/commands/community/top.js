const { SlashCommandBuilder } = require("discord.js");
const { getLeaderboard } = require("../../modules/progression/ranking");
const { infoEmbed } = require("../../utils/embeds");
const { formatDuration } = require("../../utils/time");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("top")
    .setDescription("Chat, ses, partner veya davet siralamasini gosterir.")
    .addStringOption((option) =>
      option
        .setName("kategori")
        .setDescription("Gosterilecek leaderboard")
        .setRequired(true)
        .addChoices(
          { name: "Chat", value: "chat" },
          { name: "Ses", value: "voice" },
          { name: "Partner", value: "partner" },
          { name: "Davet", value: "invite" },
        ),
    ),
  async execute(client, interaction) {
    const category = interaction.options.getString("kategori", true);
    const entries = getLeaderboard(interaction.guildId, category, 10);
    const lines = entries.length
      ? entries.map((entry, index) => {
          if (category === "chat") {
            return `#${index + 1} <@${entry.userId}> - seviye ${entry.stats.level} (${entry.stats.xp} XP)`;
          }

          if (category === "voice") {
            return `#${index + 1} <@${entry.userId}> - seviye ${entry.stats.level} (${formatDuration(entry.stats.activeSeconds * 1000)})`;
          }

          if (category === "partner") {
            return `#${index + 1} <@${entry.userId}> - ${entry.stats.score} puan`;
          }

          return `#${index + 1} <@${entry.userId}> - ${entry.stats} davet`;
        }).join("\n")
      : "Heniz veri yok.";

    await interaction.reply({
      embeds: [infoEmbed(`Bocchi ${category} top`, lines)],
      ephemeral: true,
    });
  },
};
