const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getMemberCases } = require("../../modules/moderation/cases");
const { infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cezalar")
    .setDescription("Bir uyenin ceza gecmisini gosterir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option.setName("uye").setDescription("Gecmisi gorulecek uye").setRequired(true),
    ),
  async execute(client, interaction) {
    const user = interaction.options.getUser("uye", true);
    const cases = getMemberCases(interaction.guildId, user.id).slice(-10).reverse();
    const description = cases.length
      ? cases
          .map(
            (entry) =>
              `#${entry.id} | ${entry.type} | <@${entry.moderatorId}> | ${entry.reason} | <t:${Math.floor(entry.createdAt / 1000)}:R>`,
          )
          .join("\n")
      : "Bu uye icin kayitli ceza yok.";

    await interaction.reply({
      embeds: [infoEmbed(`${user.username} ceza gecmisi`, description)],
      ephemeral: true,
    });
  },
};

