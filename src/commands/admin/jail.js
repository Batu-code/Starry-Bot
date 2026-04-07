const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { jailMember } = require("../../modules/moderation/jail");
const { evaluateEscalation } = require("../../modules/moderation/actions");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("jail")
    .setDescription("Bir uyeyi jail rolune alir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option.setName("uye").setDescription("Jail'e alinacak uye").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("sebep").setDescription("Jail sebebi").setRequired(true),
    ),
  async execute(client, interaction) {
    const user = interaction.options.getUser("uye", true);
    const reason = interaction.options.getString("sebep", true);
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
      throw new Error("Uye bulunamadi.");
    }

    const entry = await jailMember(member, interaction.user, reason);
    const escalatedTo = await evaluateEscalation(member, interaction.user, "jail", reason).catch(() => null);
    await interaction.reply({
      embeds: [
        successEmbed(
          "Jail Uygulandi",
          `${user.tag} icin case #${entry.id} olusturuldu.${escalatedTo ? ` Sistem bunu otomatik olarak **${escalatedTo}** seviyesine cikardi.` : ""}`,
        ),
      ],
      ephemeral: true,
    });
  },
};
