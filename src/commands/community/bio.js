const { SlashCommandBuilder } = require("discord.js");
const { updateProfile } = require("../../modules/progression/profiles");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bio")
    .setDescription("Profil biyografini gunceller.")
    .addStringOption((option) => option.setName("metin").setDescription("Yeni bio").setRequired(true).setMaxLength(180)),
  async execute(client, interaction) {
    const text = interaction.options.getString("metin", true);
    updateProfile(interaction.guildId, interaction.user.id, (profile) => ({
      ...profile,
      bio: text,
    }));
    await interaction.reply({ embeds: [successEmbed("Bio Guncellendi", "Profil biyografin kaydedildi.")], ephemeral: true });
  },
};

