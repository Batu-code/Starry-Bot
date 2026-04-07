const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { parseDuration, formatDuration } = require("../../utils/time");
const { scheduleAnnouncement } = require("../../modules/community/announcements");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("duyuru-planla")
    .setDescription("Bulundugun kanal icin planli duyuru ayarlar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) => option.setName("sure").setDescription("Ornek: 30dk, 2sa").setRequired(true))
    .addStringOption((option) => option.setName("metin").setDescription("Duyuru metni").setRequired(true)),
  async execute(client, interaction) {
    const duration = parseDuration(interaction.options.getString("sure", true));
    const message = interaction.options.getString("metin", true);
    if (!duration) throw new Error("Gecerli sure gir.");
    scheduleAnnouncement(interaction.guildId, {
      id: `${Date.now()}`,
      channelId: interaction.channelId,
      message,
      sendAt: Date.now() + duration,
    });
    await interaction.reply({ embeds: [successEmbed("Planli Duyuru", `${formatDuration(duration)} sonra duyuru gonderilecek.`)], ephemeral: true });
  },
};

