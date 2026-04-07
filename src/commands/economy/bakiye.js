const { SlashCommandBuilder } = require("discord.js");
const { getBalance } = require("../../modules/economy/system");
const { infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bakiye")
    .setDescription("Bakiyeni veya baska bir kullanicinin bakiyesini gosterir.")
    .addUserOption((option) => option.setName("uye").setDescription("Bakiyesi gorulecek uye").setRequired(false)),
  async execute(client, interaction) {
    const user = interaction.options.getUser("uye") || interaction.user;
    const balance = getBalance(interaction.guildId, user.id);
    await interaction.reply({ embeds: [infoEmbed("Bakiye", `${user} toplam **${balance}** coin sahibi.`)], ephemeral: true });
  },
};

