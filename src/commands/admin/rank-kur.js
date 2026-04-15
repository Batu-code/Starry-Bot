const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { patchGuildConfig } = require("../../data/store");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank-kur")
    .setDescription("Chat, ses ve partner rank ayarlarini gunceller.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption((option) =>
      option.setName("aktif").setDescription("Rank sistemi acik mi?").setRequired(false),
    )
    .addChannelOption((option) =>
      option
        .setName("level_kanali")
        .setDescription("Level atlama mesajlarinin gidecegi kanal")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false),
    )
    .addBooleanOption((option) =>
      option
        .setName("level_bildirimi")
        .setDescription("Level atlama bildirimi gonderilsin mi?")
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("mesaj_cooldown_sn")
        .setDescription("Bir kullanici ne kadar surede bir XP alsin")
        .setMinValue(5)
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("mesaj_xp_min")
        .setDescription("Mesaj basi minimum XP")
        .setMinValue(1)
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("mesaj_xp_max")
        .setDescription("Mesaj basi maksimum XP")
        .setMinValue(1)
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("ses_xp_dakika")
        .setDescription("Aktif seste dakika basina XP")
        .setMinValue(1)
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("partner_onay_puan")
        .setDescription("Onaylanan partner basina puan")
        .setMinValue(1)
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("partner_yenileme_puan")
        .setDescription("Partner yenileme basina puan")
        .setMinValue(1)
        .setRequired(false),
    ),
  async execute(client, interaction) {
    const enabled = interaction.options.getBoolean("aktif");
    const levelChannel = interaction.options.getChannel("level_kanali");
    const announceLevelUps = interaction.options.getBoolean("level_bildirimi");
    const messageCooldownSeconds = interaction.options.getInteger("mesaj_cooldown_sn");
    const messageXpMin = interaction.options.getInteger("mesaj_xp_min");
    const messageXpMax = interaction.options.getInteger("mesaj_xp_max");
    const voiceXpPerMinute = interaction.options.getInteger("ses_xp_dakika");
    const approvalPoints = interaction.options.getInteger("partner_onay_puan");
    const renewalPoints = interaction.options.getInteger("partner_yenileme_puan");

    patchGuildConfig(interaction.guildId, {
      progression: {
        leveling: {
          enabled: enabled ?? undefined,
          levelUpChannelId: levelChannel?.id || undefined,
          announceLevelUps: announceLevelUps ?? undefined,
          messageCooldownMs: messageCooldownSeconds ? messageCooldownSeconds * 1000 : undefined,
          messageXpMin: messageXpMin ?? undefined,
          messageXpMax: messageXpMax ?? undefined,
          voiceXpPerMinute: voiceXpPerMinute ?? undefined,
        },
        partnering: {
          approvalPoints: approvalPoints ?? undefined,
          renewalPoints: renewalPoints ?? undefined,
        },
      },
    });

    await interaction.reply({
      embeds: [successEmbed("Rank Ayarlari Guncellendi", "Chat, ses ve partner rank ayarlari kaydedildi.")],
      ephemeral: true,
    });
  },
};
