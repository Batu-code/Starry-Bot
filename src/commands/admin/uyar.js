const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { addCase } = require("../../modules/moderation/cases");
const { evaluateEscalation } = require("../../modules/moderation/actions");
const { sendLog } = require("../../modules/logging/sendLog");
const { recordModeratorIncident } = require("../../modules/security/moderatorAudit");
const { successEmbed } = require("../../utils/embeds");
const { COLORS } = require("../../constants");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("uyar")
    .setDescription("Bir uyeye uyari case'i ekler.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option.setName("uye").setDescription("Uyarilacak uye").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("sebep").setDescription("Uyari sebebi").setRequired(true),
    ),
  async execute(client, interaction) {
    const user = interaction.options.getUser("uye", true);
    const reason = interaction.options.getString("sebep", true);
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    const entry = addCase(interaction.guildId, {
      type: "warn",
      targetId: user.id,
      moderatorId: interaction.user.id,
      reason,
    });

    await sendLog(interaction.guild, {
      color: COLORS.warning,
      title: "Uyari Verildi",
      description: `${user.tag} uyarildi.`,
      fields: [
        { name: "Case", value: `#${entry.id}`, inline: true },
        { name: "Yetkili", value: `<@${interaction.user.id}>`, inline: true },
        { name: "Sebep", value: reason, inline: false },
      ],
    });
    recordModeratorIncident(interaction.guildId, {
      moderatorId: interaction.user.id,
      type: "warn",
      source: "moderation",
      reason,
      targetId: user.id,
    });

    const escalatedTo = member
      ? await evaluateEscalation(member, interaction.user, "warn", reason).catch(() => null)
      : null;

    await interaction.reply({
      embeds: [
        successEmbed(
          "Uyari Kaydedildi",
          `${user.tag} icin case #${entry.id} eklendi.${escalatedTo ? ` Otomatik olarak **${escalatedTo}** cezasina yukseltti.` : ""}`,
        ),
      ],
      ephemeral: true,
    });
  },
};
