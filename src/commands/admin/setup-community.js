const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");
const { patchGuildConfig } = require("../../data/store");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("topluluk-kur")
    .setDescription("Topluluk, ticket ve hos geldin ayarlarini yapar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option
        .setName("hosgeldin_kanali")
        .setDescription("Hos geldin mesaji kanali")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    )
    .addChannelOption((option) =>
      option
        .setName("cikis_kanali")
        .setDescription("Cikis mesaji kanali")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false),
    )
    .addChannelOption((option) =>
      option
        .setName("topluluk_log_kanali")
        .setDescription("Topluluk olay log kanali")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("hosgeldin_mesaji")
        .setDescription("{user} etiketi kullanabilirsin")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("cikis_mesaji")
        .setDescription("{userTag}, {memberCount} degiskenlerini kullanabilirsin")
        .setRequired(false),
    )
    .addChannelOption((option) =>
      option
        .setName("boost_kanali")
        .setDescription("Boost mesajlari kanali")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false),
    )
    .addChannelOption((option) =>
      option
        .setName("haftalik_rapor_kanali")
        .setDescription("Haftalik ozet raporlarinin gidecegi kanal")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("boost_mesaji")
        .setDescription("{user}, {boostCount} degiskenlerini kullanabilirsin")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("rapor_gunu")
        .setDescription("Haftalik rapor hangi gun gitsin")
        .addChoices(
          { name: "Pazartesi", value: "1" },
          { name: "Sali", value: "2" },
          { name: "Carsamba", value: "3" },
          { name: "Persembe", value: "4" },
          { name: "Cuma", value: "5" },
          { name: "Cumartesi", value: "6" },
          { name: "Pazar", value: "0" },
        )
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("rapor_saat")
        .setDescription("24 saat formatinda")
        .setMinValue(0)
        .setMaxValue(23)
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("rapor_dakika")
        .setDescription("Dakika")
        .setMinValue(0)
        .setMaxValue(59)
        .setRequired(false),
    )
    .addRoleOption((option) =>
      option.setName("otorol").setDescription("Yeni uye otomatik rolu").setRequired(false),
    )
    .addRoleOption((option) =>
      option.setName("boost_rolu").setDescription("Boost yapanlara verilecek rol").setRequired(false),
    )
    .addRoleOption((option) =>
      option.setName("destek_ekibi_rolu").setDescription("Ticket gorevli rolu").setRequired(false),
    )
    .addChannelOption((option) =>
      option
        .setName("ticket_kategorisi")
        .setDescription("Ticket kanallarinin olusacagi kategori")
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(false),
    )
    .addChannelOption((option) =>
      option
        .setName("transcript_kanali")
        .setDescription("Ticket transcript kanali")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false),
    )
    .addChannelOption((option) =>
      option
        .setName("istatistik_kategorisi")
        .setDescription("Sayac ses kanallari kategorisi")
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(false),
    )
    .addChannelOption((option) =>
      option
        .setName("temp_voice_lobi")
        .setDescription("Gecici oda olusturacak ses kanali")
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(false),
    )
    .addChannelOption((option) =>
      option
        .setName("temp_voice_kategori")
        .setDescription("Gecici odalarin acilacagi kategori")
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(false),
    )
    .addRoleOption((option) =>
      option
        .setName("cekilis_yonetici_rolu")
        .setDescription("Cekilis yonetebilecek rol")
        .setRequired(false),
    ),
  async execute(client, interaction) {
    const welcomeChannel = interaction.options.getChannel("hosgeldin_kanali", true);
    const leaveChannel = interaction.options.getChannel("cikis_kanali");
    const communityLogChannel = interaction.options.getChannel("topluluk_log_kanali");
    const welcomeMessage = interaction.options.getString("hosgeldin_mesaji");
    const leaveMessage = interaction.options.getString("cikis_mesaji");
    const boostChannel = interaction.options.getChannel("boost_kanali");
    const weeklyReportChannel = interaction.options.getChannel("haftalik_rapor_kanali");
    const boostMessage = interaction.options.getString("boost_mesaji");
    const reportDay = interaction.options.getString("rapor_gunu");
    const reportHour = interaction.options.getInteger("rapor_saat");
    const reportMinute = interaction.options.getInteger("rapor_dakika");
    const autoRole = interaction.options.getRole("otorol");
    const boostRole = interaction.options.getRole("boost_rolu");
    const supportRole = interaction.options.getRole("destek_ekibi_rolu");
    const ticketCategory = interaction.options.getChannel("ticket_kategorisi");
    const transcriptChannel = interaction.options.getChannel("transcript_kanali");
    const statsCategory = interaction.options.getChannel("istatistik_kategorisi");
    const tempVoiceLobby = interaction.options.getChannel("temp_voice_lobi");
    const tempVoiceCategory = interaction.options.getChannel("temp_voice_kategori");
    const giveawayManagerRole = interaction.options.getRole("cekilis_yonetici_rolu");

    patchGuildConfig(interaction.guildId, {
      community: {
        logChannelId: communityLogChannel?.id || null,
        welcomeChannelId: welcomeChannel.id,
        leaveChannelId: leaveChannel?.id || null,
        welcomeMessage: welcomeMessage || undefined,
        leaveMessage: leaveMessage || undefined,
        autoRoleIds: autoRole ? [autoRole.id] : [],
        ticket: {
          categoryId: ticketCategory?.id || null,
          transcriptChannelId: transcriptChannel?.id || null,
          supportRoleId: supportRole?.id || null,
        },
        tempVoice: {
          enabled: Boolean(tempVoiceLobby && tempVoiceCategory),
          lobbyChannelId: tempVoiceLobby?.id || null,
          categoryId: tempVoiceCategory?.id || null,
        },
        stats: {
          enabled: Boolean(statsCategory),
          categoryId: statsCategory?.id || null,
        },
        giveaways: {
          enabled: true,
          managerRoleId: giveawayManagerRole?.id || null,
        },
        boost: {
          channelId: boostChannel?.id || null,
          roleId: boostRole?.id || null,
          message: boostMessage || undefined,
        },
      },
    });

    patchGuildConfig(interaction.guildId, {
      automation: {
        weeklyReports: {
          enabled: Boolean(weeklyReportChannel),
          channelId: weeklyReportChannel?.id || null,
          dayOfWeek: reportDay !== null ? Number(reportDay) : undefined,
          hour: reportHour ?? undefined,
          minute: reportMinute ?? undefined,
        },
      },
    });

    await interaction.reply({
      embeds: [successEmbed("Topluluk Ayarlandi", "Hos geldin, cikis, boost, ticket ve haftalik rapor ayarlari kaydedildi.")],
      ephemeral: true,
    });
  },
};
