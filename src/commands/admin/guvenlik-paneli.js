const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("guvenlik-paneli")
    .setDescription("Guvenlik modullerini butonlarla yonetir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(client, interaction) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("security_toggle:antiRaid").setLabel("Anti-Raid").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("security_toggle:antiSpam").setLabel("Anti-Spam").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("security_toggle:antiAlt").setLabel("Anti-Alt").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("security_toggle:antiPhishing").setLabel("Anti-Phishing").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("security_toggle:risk").setLabel("Risk").setStyle(ButtonStyle.Secondary),
    );
    const rowTwo = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("security_toggle:scamShield").setLabel("Scam Shield").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("security_toggle:moderatorAudit").setLabel("Yetkili Denetim").setStyle(ButtonStyle.Secondary),
    );
    await interaction.reply({ embeds: [infoEmbed("Guvenlik Paneli", "Modulleri acip kapatmak icin butonlari kullan.")], components: [row, rowTwo], ephemeral: true });
  },
};
