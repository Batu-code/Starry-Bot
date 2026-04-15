const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { addCustomCommand } = require("../../modules/community/customCommands");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ozel-komut-ekle")
    .setDescription("Prefix ile calisan ozel komut ekler.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) =>
      option.setName("tetikleyici").setDescription("Ornek: kurallar").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("cevap").setDescription("Botun verecegi cevap").setRequired(true),
    ),
  async execute(client, interaction) {
    addCustomCommand(interaction.guildId, {
      trigger: interaction.options.getString("tetikleyici", true),
      response: interaction.options.getString("cevap", true),
    });

    await interaction.reply({
      embeds: [successEmbed("Ozel Komut Eklendi", "Yeni prefix komutu kaydedildi.")],
      ephemeral: true,
    });
  },
};
