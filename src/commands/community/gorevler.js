const { SlashCommandBuilder } = require("discord.js");
const { getGuildConfig } = require("../../data/store");
const { infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gorevler")
    .setDescription("Gunluk gorevlerini gosterir."),
  async execute(client, interaction) {
    const config = getGuildConfig(interaction.guildId);
    const userStats = config.stats.messages[interaction.user.id] || { xp: 0 };
    const completed = config.progression.profiles[interaction.user.id]?.completedTasks || {};
    const tasks = [
      `10 mesaj at - ${completed.chat_10 ? "Tamamlandi" : `Ilerleme: ${Math.min(10, Math.floor((userStats.xp || 0) / 10))}/10`}`,
      `1 kez /calis kullan - ${completed.work_once ? "Tamamlandi" : "Bekliyor"}`,
      `1 kisi davet et - ${completed.invite_once ? "Tamamlandi" : `Ilerleme: ${Math.min(1, config.stats.invites[interaction.user.id] || 0)}/1`}`,
    ];
    await interaction.reply({ embeds: [infoEmbed("Gunluk Gorevler", tasks.join("\n"))], ephemeral: true });
  },
};

