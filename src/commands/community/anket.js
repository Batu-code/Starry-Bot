const { SlashCommandBuilder } = require("discord.js");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("anket")
    .setDescription("Basit bir anket olusturur.")
    .addStringOption((option) => option.setName("soru").setDescription("Anket sorusu").setRequired(true)),
  async execute(client, interaction) {
    const question = interaction.options.getString("soru", true);
    const message = await interaction.channel.send({ content: `📊 **Anket**\n${question}` });
    await message.react("👍").catch(() => null);
    await message.react("👎").catch(() => null);
    await interaction.reply({ embeds: [successEmbed("Anket Olustu", "Anket mesaji gonderildi.")], ephemeral: true });
  },
};

