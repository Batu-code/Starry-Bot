const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { patchGuildConfig } = require("../../data/store");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yetkili-alim-kur")
    .setDescription("Oto yetkili alim sistemini ayarlar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption((option) =>
      option.setName("aktif").setDescription("Sistem aktif olsun mu?").setRequired(true),
    )
    .addRoleOption((option) =>
      option.setName("yetkili_rolu").setDescription("Saglaninca verilecek rol").setRequired(true),
    )
    .addChannelOption((option) =>
      option
        .setName("log_kanali")
        .setDescription("Oto yetkili log kanali")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("min_chat_seviye")
        .setDescription("Minimum chat seviyesi")
        .setMinValue(0)
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("min_ses_saat")
        .setDescription("Minimum aktif ses saati")
        .setMinValue(0)
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("min_davet")
        .setDescription("Minimum davet")
        .setMinValue(0)
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("min_partner_puan")
        .setDescription("Minimum partner puani")
        .setMinValue(0)
        .setRequired(false),
    ),
  async execute(client, interaction) {
    const enabled = interaction.options.getBoolean("aktif", true);
    const role = interaction.options.getRole("yetkili_rolu", true);
    const logChannel = interaction.options.getChannel("log_kanali");
    const minMessageLevel = interaction.options.getInteger("min_chat_seviye");
    const minVoiceHours = interaction.options.getInteger("min_ses_saat");
    const minInviteCount = interaction.options.getInteger("min_davet");
    const minPartnerScore = interaction.options.getInteger("min_partner_puan");

    patchGuildConfig(interaction.guildId, {
      community: {
        staffRecruitment: {
          enabled,
          roleId: role.id,
          logChannelId: logChannel?.id || null,
          minMessageLevel: minMessageLevel ?? undefined,
          minVoiceHours: minVoiceHours ?? undefined,
          minInviteCount: minInviteCount ?? undefined,
          minPartnerScore: minPartnerScore ?? undefined,
        },
      },
    });

    await interaction.reply({
      embeds: [successEmbed("Oto Yetkili Alim Guncellendi", "Yeni alım kosullari kaydedildi.")],
      ephemeral: true,
    });
  },
};
