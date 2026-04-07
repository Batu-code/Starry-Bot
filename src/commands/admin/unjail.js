const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { unjailMember } = require("../../modules/moderation/jail");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("jail-kaldir")
    .setDescription("Bir uyeyi jail'den cikarir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option.setName("uye").setDescription("Jail'den cikacak uye").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("sebep").setDescription("Aciklama").setRequired(false),
    ),
  async execute(client, interaction) {
    const user = interaction.options.getUser("uye", true);
    const reason = interaction.options.getString("sebep") || "Jail kaldirildi";
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
      throw new Error("Uye bulunamadi.");
    }

    const entry = await unjailMember(member, interaction.user, reason);
    await interaction.reply({
      embeds: [successEmbed("Jail Kaldirildi", `${user.tag} icin case #${entry.id} olusturuldu.`)],
      ephemeral: true,
    });
  },
};
