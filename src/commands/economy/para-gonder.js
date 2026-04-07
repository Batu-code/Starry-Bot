const { SlashCommandBuilder } = require("discord.js");
const { getBalance, setBalance } = require("../../modules/economy/system");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("para-gonder")
    .setDescription("Baska bir kullaniciya coin gonderir.")
    .addUserOption((option) => option.setName("uye").setDescription("Hedef uye").setRequired(true))
    .addIntegerOption((option) => option.setName("miktar").setDescription("Gonderilecek miktar").setRequired(true).setMinValue(1)),
  async execute(client, interaction) {
    const user = interaction.options.getUser("uye", true);
    const amount = interaction.options.getInteger("miktar", true);
    const senderBalance = getBalance(interaction.guildId, interaction.user.id);
    if (senderBalance < amount) {
      throw new Error("Yetersiz bakiye.");
    }
    setBalance(interaction.guildId, interaction.user.id, senderBalance - amount);
    setBalance(interaction.guildId, user.id, getBalance(interaction.guildId, user.id) + amount);
    await interaction.reply({
      embeds: [successEmbed("Transfer Tamam", `${user} kullanicisina **${amount}** coin gonderildi.`)],
      ephemeral: true,
    });
  },
};

