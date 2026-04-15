const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { removeCustomCommand } = require("../../modules/community/customCommands");
const { successEmbed, dangerEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ozel-komut-sil")
    .setDescription("Kayitli ozel komutu siler.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) =>
      option.setName("tetikleyici").setDescription("Silinecek komut").setRequired(true),
    ),
  async execute(client, interaction) {
    const removed = removeCustomCommand(interaction.guildId, interaction.options.getString("tetikleyici", true));
    await interaction.reply({
      embeds: [
        removed
          ? successEmbed("Ozel Komut Silindi", "Komut kaydi kaldirildi.")
          : dangerEmbed("Komut Bulunamadi", "Bu isimde ozel komut yok."),
      ],
      ephemeral: true,
    });
  },
};
