const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { patchGuildConfig } = require("../../data/store");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("partnerlik-kur")
    .setDescription("Partnerlik sistemini yapilandirir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option
        .setName("basvuru_kategorisi")
        .setDescription("Partnerlik basvuru kanallari bu kategoride olusur")
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true),
    )
    .addRoleOption((option) =>
      option
        .setName("yonetici_rolu")
        .setDescription("Partnerlik basvurularini yonetecek rol")
        .setRequired(true),
    )
    .addChannelOption((option) =>
      option
        .setName("partner_kanali")
        .setDescription("Onaylanan partner reklamlarinin paylasilacagi kanal")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false),
    )
    .addChannelOption((option) =>
      option
        .setName("log_kanali")
        .setDescription("Partnerlik log kanali")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false),
    )
    .addChannelOption((option) =>
      option
        .setName("arsiv_kategorisi")
        .setDescription("Onaylanan veya reddedilen basvurularin tasinacagi kategori")
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("minimum_uye")
        .setDescription("Minimum partner sunucu uye sayisi")
        .setRequired(false)
        .setMinValue(1),
    ),
  async execute(client, interaction) {
    const category = interaction.options.getChannel("basvuru_kategorisi", true);
    const managerRole = interaction.options.getRole("yonetici_rolu", true);
    const partnerChannel = interaction.options.getChannel("partner_kanali");
    const logChannel = interaction.options.getChannel("log_kanali");
    const archiveCategory = interaction.options.getChannel("arsiv_kategorisi");
    const minimumMember = interaction.options.getInteger("minimum_uye") || 50;

    patchGuildConfig(interaction.guildId, {
      community: {
        partnership: {
          enabled: true,
          categoryId: category.id,
          archiveCategoryId: archiveCategory?.id || null,
          partnerChannelId: partnerChannel?.id || null,
          logChannelId: logChannel?.id || null,
          managerRoleId: managerRole.id,
          minMemberCount: minimumMember,
        },
      },
    });

    await interaction.reply({
      embeds: [successEmbed("Partnerlik Ayarlandi", "Partnerlik sistemi bu sunucu icin aktif edildi.")],
      ephemeral: true,
    });
  },
};

