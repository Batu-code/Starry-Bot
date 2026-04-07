const { SlashCommandBuilder } = require("discord.js");
const { claimDaily } = require("../../modules/economy/system");
const { completeTask } = require("../../modules/progression/profiles");
const { successEmbed, warningEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gunluk")
    .setDescription("Gunluk coin odulunu alirsin."),
  async execute(client, interaction) {
    const reward = claimDaily(interaction.guildId, interaction.user.id);
    if (!reward) {
      await interaction.reply({ embeds: [warningEmbed("Gunluk Odul", "Gunluk odulunu daha once almissin.")], ephemeral: true });
      return;
    }
    completeTask(interaction.guildId, interaction.user.id, "daily_claim");
    await interaction.reply({ embeds: [successEmbed("Gunluk Odul", `Hesabina **${reward}** coin eklendi.`)], ephemeral: true });
  },
};

