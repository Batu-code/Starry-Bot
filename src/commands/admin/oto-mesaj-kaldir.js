const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { removeAutoMessage } = require("../../modules/community/autoMessages");
const { successEmbed, dangerEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("oto-mesaj-kaldir")
    .setDescription("Kayitli oto mesaji siler.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) =>
      option.setName("id").setDescription("Silinecek oto mesaj ID").setRequired(true),
    ),
  async execute(client, interaction) {
    const removed = removeAutoMessage(interaction.guildId, interaction.options.getString("id", true));
    await interaction.reply({
      embeds: [
        removed
          ? successEmbed("Oto Mesaj Kaldirildi", "Kayit basariyla silindi.")
          : dangerEmbed("Oto Mesaj Bulunamadi", "Verilen ID ile kayit yok."),
      ],
      ephemeral: true,
    });
  },
};
