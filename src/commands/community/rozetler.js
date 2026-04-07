const { SlashCommandBuilder } = require("discord.js");
const { getGuildConfig } = require("../../data/store");
const { getProfile } = require("../../modules/progression/profiles");
const { infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rozetler")
    .setDescription("Kullanici rozetlerini gosterir.")
    .addUserOption((option) => option.setName("uye").setDescription("Bakilacak uye").setRequired(false)),
  async execute(client, interaction) {
    const user = interaction.options.getUser("uye") || interaction.user;
    const config = getGuildConfig(interaction.guildId);
    const profile = getProfile(interaction.guildId, user.id);
    const badges = profile.badges.length
      ? profile.badges.map((id) => `**${config.progression.badges[id]?.name || id}**`).join("\n")
      : "Rozet yok.";
    await interaction.reply({ embeds: [infoEmbed("Rozetler", `${user}\n${badges}`)], ephemeral: true });
  },
};
