const { SlashCommandBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("itiraz")
    .setDescription("Ceza veya basvuru karari icin itiraz gonderir."),
  async execute(client, interaction) {
    const modal = new ModalBuilder()
      .setCustomId("appeal_modal")
      .setTitle("Itiraz Formu")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("appeal_subject")
            .setLabel("Itiraz basligi")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(100),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("appeal_body")
            .setLabel("Detayli itiraz metni")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1000),
        ),
      );

    await interaction.showModal(modal);
  },
};

