const { SlashCommandBuilder } = require("discord.js");
const { getGuildConfig } = require("../../data/store");
const { infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("davetler")
    .setDescription("Sunucudaki davet istatistigini gosterir.")
    .addUserOption((option) =>
      option.setName("uye").setDescription("Istatisigi gorulecek uye").setRequired(false),
    ),
  async execute(client, interaction) {
    const user = interaction.options.getUser("uye") || interaction.user;
    const config = getGuildConfig(interaction.guildId);
    const total = config.stats.invites?.[user.id] || 0;

    await interaction.reply({
      embeds: [infoEmbed("Davet Istatisigi", `${user} toplam **${total}** kisi getirmis.`)],
      ephemeral: true,
    });
  },
};

