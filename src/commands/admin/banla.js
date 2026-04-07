const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { banMember } = require("../../modules/moderation/actions");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("banla")
    .setDescription("Bir uyeyi banlar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((option) => option.setName("uye").setDescription("Hedef uye").setRequired(true))
    .addStringOption((option) => option.setName("sebep").setDescription("Sebep").setRequired(true)),
  async execute(client, interaction) {
    const user = interaction.options.getUser("uye", true);
    const reason = interaction.options.getString("sebep", true);
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) throw new Error("Uye bulunamadi.");
    await banMember(member, interaction.user, reason);
    await interaction.reply({ embeds: [successEmbed("Uye Banlandi", `${user.tag} banlandi.`)], ephemeral: true });
  },
};

