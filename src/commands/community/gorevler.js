const { SlashCommandBuilder } = require("discord.js");
const { getGuildConfig } = require("../../data/store");
const { getCombinedRankProfile } = require("../../modules/progression/ranking");
const { infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gorevler")
    .setDescription("Gunluk gorevlerini gosterir."),
  async execute(client, interaction) {
    const config = getGuildConfig(interaction.guildId);
    const rankProfile = getCombinedRankProfile(interaction.guildId, interaction.user.id);
    const completed = config.progression.profiles[interaction.user.id]?.completedTasks || {};
    const tasks = [
      `10 mesaj at - ${completed.chat_10 ? "Tamamlandi" : `Ilerleme: ${Math.min(10, rankProfile.message.messageCount)}/10`}`,
      `1 kisi davet et - ${completed.invite_once ? "Tamamlandi" : `Ilerleme: ${Math.min(1, config.stats.invites[interaction.user.id] || 0)}/1`}`,
      `1 saat aktif seste kal - ${rankProfile.voice.activeSeconds >= 3600 ? "Tamamlandi" : `Ilerleme: ${Math.min(60, Math.floor(rankProfile.voice.activeSeconds / 60))}/60 dk`}`,
    ];
    await interaction.reply({ embeds: [infoEmbed("Gunluk Gorevler", tasks.join("\n"))], ephemeral: true });
  },
};
