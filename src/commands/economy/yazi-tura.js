const { SlashCommandBuilder } = require("discord.js");
const { coinflip } = require("../../modules/economy/system");
const { successEmbed, dangerEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yazi-tura")
    .setDescription("Coin ile yazi tura oynarsin.")
    .addIntegerOption((option) => option.setName("miktar").setDescription("Bahis miktari").setRequired(true).setMinValue(1))
    .addStringOption((option) =>
      option.setName("secim").setDescription("Yazi mi tura mi").setRequired(true).addChoices(
        { name: "Yazi", value: "yazi" },
        { name: "Tura", value: "tura" },
      ),
    ),
  async execute(client, interaction) {
    const amount = interaction.options.getInteger("miktar", true);
    const guess = interaction.options.getString("secim", true);
    const result = coinflip(interaction.guildId, interaction.user.id, amount, guess);
    await interaction.reply({
      embeds: [result.won ? successEmbed("Kazandin", `Sonuc **${result.result}**. ${amount} coin kazandin.`) : dangerEmbed("Kaybettin", `Sonuc **${result.result}**. ${amount} coin kaybettin.`)],
      ephemeral: true,
    });
  },
};

