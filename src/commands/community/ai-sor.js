const { SlashCommandBuilder } = require("discord.js");
const { generateSupportAnswer } = require("../../modules/ai/openai");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ai-sor")
    .setDescription("AI destek asistanina soru sorar.")
    .addStringOption((option) =>
      option.setName("soru").setDescription("Sorun veya sorunun").setRequired(true),
    ),
  async execute(client, interaction) {
    await interaction.deferReply();
    const question = interaction.options.getString("soru", true);
    const answer = await generateSupportAnswer(interaction.guildId, question, {
      userTag: interaction.user.tag,
      channelName: interaction.channel?.name || null,
    });

    await interaction.editReply({
      embeds: [successEmbed("AI Destek Yaniti", answer.slice(0, 4000))],
    });
  },
};

