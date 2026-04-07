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
    .addStringOption((option) =>
      option
        .setName("hosgeldin_mesaji")
        .setDescription("{user} etiketi kullanabilirsin")
        .setRequired(false),
    )
    .addRoleOption((option) =>
      option.setName("otorol").setDescription("Yeni uye otomatik rolu").setRequired(false),
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
    const welcomeMessage = interaction.options.getString("hosgeldin_mesaji");
    const autoRole = interaction.options.getRole("otorol");
    const supportRole = interaction.options.getRole("destek_ekibi_rolu");
    const ticketCategory = interaction.options.getChannel("ticket_kategorisi");
    const transcriptChannel = interaction.options.getChannel("transcript_kanali");
    const statsCategory = interaction.options.getChannel("istatistik_kategorisi");
    const tempVoiceLobby = interaction.options.getChannel("temp_voice_lobi");
    const tempVoiceCategory = interaction.options.getChannel("temp_voice_kategori");
    const giveawayManagerRole = interaction.options.getRole("cekilis_yonetici_rolu");

    patchGuildConfig(interaction.guildId, {
      community: {
        welcomeChannelId: welcomeChannel.id,
        welcomeMessage: welcomeMessage || undefined,
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
      },
    });

    await interaction.reply({
      embeds: [successEmbed("Topluluk Ayarlandi", "Hos geldin, ticket, temp voice ve istatistik ayarlari kaydedildi.")],
      ephemeral: true,
    });
  },
};
