const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("duyuru")
    .setDescription("Bulundugun kanala duyuru gonderir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) => option.setName("metin").setDescription("Duyuru metni").setRequired(true)),
  async execute(client, interaction) {
    const text = interaction.options.getString("metin", true);
    await interaction.channel.send({ content: `📢 **Duyuru**\n${text}` });
    await interaction.reply({ embeds: [successEmbed("Duyuru Gonderildi", "Duyuru paylasildi.")], ephemeral: true });
  },
};

