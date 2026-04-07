const { SlashCommandBuilder } = require("discord.js");
const { getGuildConfig } = require("../../data/store");
const { infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("partnerler")
    .setDescription("Kayitli partner sunuculari listeler."),
  async execute(client, interaction) {
    const partners = getGuildConfig(interaction.guildId).community.partnership.partners || [];
    const description = partners.length
      ? partners
          .slice(-15)
          .reverse()
          .map((entry) => `**${entry.serverName}** | ${entry.inviteLink} | ${entry.memberCount} uye`)
          .join("\n")
          .slice(0, 4000)
      : "Kayitli partner yok.";

    await interaction.reply({
      embeds: [infoEmbed("Partner Sunucular", description)],
      ephemeral: true,
    });
  },
};
