const { SlashCommandBuilder } = require("discord.js");
const { workShift } = require("../../modules/economy/system");
const { completeTask } = require("../../modules/progression/profiles");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("calis")
    .setDescription("Calisip coin kazanirsin."),
  async execute(client, interaction) {
    const reward = workShift(interaction.guildId, interaction.user.id);
    completeTask(interaction.guildId, interaction.user.id, "work_once");
    await interaction.reply({ embeds: [successEmbed("Vardiya Tamam", `Bugunku vardiyadan **${reward}** coin kazandin.`)], ephemeral: true });
  },
};

