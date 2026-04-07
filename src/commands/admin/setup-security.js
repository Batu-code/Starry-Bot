const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { patchGuildConfig } = require("../../data/store");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("guvenlik-kur")
    .setDescription("Guvenlik sistemini yapilandirir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option
        .setName("log_kanali")
        .setDescription("Guvenlik log kanali")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    )
    .addRoleOption((option) =>
      option.setName("karantina_rolu").setDescription("Raid durumunda verilecek rol").setRequired(false),
    )
    .addRoleOption((option) =>
      option.setName("jail_rolu").setDescription("Guvenlik ihlalinde verilecek jail rolu").setRequired(false),
    )
    .addRoleOption((option) =>
      option.setName("dogrulandi_rolu").setDescription("Dogrulama tamamlaninca verilecek rol").setRequired(false),
    )
    .addRoleOption((option) =>
      option.setName("dogrulanmamis_rolu").setDescription("Yeni uyeye verilecek rol").setRequired(false),
    )
    .addChannelOption((option) =>
      option
        .setName("dogrulama_kanali")
        .setDescription("Dogrulama butonunun gidecegi kanal")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option.setName("join_limiti").setDescription("Raid icin pencere basina giris limiti").setMinValue(3),
    ),
  async execute(client, interaction) {
    const logChannel = interaction.options.getChannel("log_kanali", true);
    const quarantineRole = interaction.options.getRole("karantina_rolu");
    const jailRole = interaction.options.getRole("jail_rolu");
    const verifiedRole = interaction.options.getRole("dogrulandi_rolu");
    const unverifiedRole = interaction.options.getRole("dogrulanmamis_rolu");
    const verificationChannel = interaction.options.getChannel("dogrulama_kanali");
    const joinLimit = interaction.options.getInteger("join_limiti");

    patchGuildConfig(interaction.guildId, {
      security: {
        logChannelId: logChannel.id,
        quarantineRoleId: quarantineRole?.id || null,
        jailRoleId: jailRole?.id || null,
        verifiedRoleId: verifiedRole?.id || null,
        unverifiedRoleId: unverifiedRole?.id || null,
        antiRaid: {
          joinLimit: joinLimit || 6,
        },
      },
      community: {
        verificationChannelId: verificationChannel?.id || null,
      },
    });

    if (verificationChannel && verifiedRole) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("verify_member")
          .setLabel("Dogrulamayi Tamamla")
          .setStyle(ButtonStyle.Success),
      );

      await verificationChannel.send({
        content: "Sunucuda tam erisim icin butona tikla.",
        components: [row],
      }).catch(() => null);
    }

    await interaction.reply({
      embeds: [
        successEmbed(
          "Guvenlik Ayarlandi",
          "Anti-raid, log ve dogrulama ayarlari guncellendi.",
        ),
      ],
      ephemeral: true,
    });
  },
};
