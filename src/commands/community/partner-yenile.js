const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { extendPartner } = require("../../modules/community/partnerRenewals");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("partner-yenile")
    .setDescription("Bir partner kaydinin suresini uzatir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) => option.setName("sunucu").setDescription("Partner sunucu adi").setRequired(true))
    .addIntegerOption((option) => option.setName("gun").setDescription("Kac gun uzatilacak").setRequired(true).setMinValue(1)),
  async execute(client, interaction) {
    const partner = extendPartner(
      interaction.guildId,
      interaction.options.getString("sunucu", true),
      interaction.options.getInteger("gun", true),
    );
    await interaction.reply({
      embeds: [successEmbed("Partner Yenilendi", `${partner.serverName} icin sure uzatildi.`)],
      ephemeral: true,
    });
  },
};

