const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { parseDuration, formatDuration } = require("../../utils/time");
const { tempJailMember } = require("../../modules/moderation/actions");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gecici-jail")
    .setDescription("Bir uyeyi belirli sureligine jail'e alir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) => option.setName("uye").setDescription("Hedef uye").setRequired(true))
    .addStringOption((option) => option.setName("sure").setDescription("Ornek: 2sa, 1g").setRequired(true))
    .addStringOption((option) => option.setName("sebep").setDescription("Sebep").setRequired(true)),
  async execute(client, interaction) {
    const user = interaction.options.getUser("uye", true);
    const duration = parseDuration(interaction.options.getString("sure", true));
    const reason = interaction.options.getString("sebep", true);
    if (!duration) throw new Error("Gecerli sure gir.");
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) throw new Error("Uye bulunamadi.");
    await tempJailMember(member, interaction.user, duration, reason);
    await interaction.reply({ embeds: [successEmbed("Gecici Jail", `${user.tag} ${formatDuration(duration)} jail'e alindi.`)], ephemeral: true });
  },
};

