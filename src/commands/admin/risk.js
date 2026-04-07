const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getRiskEntry } = require("../../modules/security/risk");
const { infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("risk")
    .setDescription("Bir kullanicinin risk puanini gosterir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) => option.setName("uye").setDescription("Bakilacak uye").setRequired(true)),
  async execute(client, interaction) {
    const user = interaction.options.getUser("uye", true);
    const risk = getRiskEntry(interaction.guildId, user.id);
    const history = risk.history.length
      ? risk.history.slice(-5).reverse().map((item) => `+${item.amount} | ${item.reason}`).join("\n")
      : "Kayit yok.";
    await interaction.reply({ embeds: [infoEmbed("Risk Durumu", `Kullanici: ${user}\nPuan: **${risk.score}**\n\n${history}`)], ephemeral: true });
  },
};

