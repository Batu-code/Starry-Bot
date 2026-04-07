const { SlashCommandBuilder } = require("discord.js");
const { joinClan } = require("../../modules/economy/system");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("klan-katil")
    .setDescription("Bir klana katilirsin.")
    .addStringOption((option) => option.setName("kod").setDescription("Klan kodu").setRequired(true)),
  async execute(client, interaction) {
    const clan = joinClan(interaction.guildId, interaction.user.id, interaction.options.getString("kod", true));
    await interaction.reply({ embeds: [successEmbed("Klana Katildin", `${clan.name} klanina katildin.`)], ephemeral: true });
  },
};

