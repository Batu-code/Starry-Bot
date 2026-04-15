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
    const detail = config.stats.inviteDetails?.[user.id] || {
      regular: total,
      fake: 0,
      leaves: 0,
      bonusClaimed: [],
    };

    await interaction.reply({
      embeds: [
        infoEmbed(
          "Davet Istatisigi",
          [
            `${user} toplam **${total}** gecerli davet getirmis.`,
            `Fake: **${detail.fake || 0}**`,
            `Cikis: **${detail.leaves || 0}**`,
            `Bonus esik: **${(detail.bonusClaimed || []).join(", ") || "Yok"}**`,
          ].join("\n"),
        ),
      ],
      ephemeral: true,
    });
  },
};
