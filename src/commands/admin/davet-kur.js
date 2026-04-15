const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { patchGuildConfig } = require("../../data/store");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("davet-kur")
    .setDescription("Gelişmis davet ve fake davet ayarlarini gunceller.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption((option) =>
      option.setName("fake_hesap_gun").setDescription("Bundan yeni hesaplar fake sayilir").setMinValue(0).setRequired(false),
    )
    .addBooleanOption((option) =>
      option.setName("cikista_dus").setDescription("Sunucudan cikinca davet dussun mu").setRequired(false),
    )
    .addIntegerOption((option) =>
      option.setName("esik_odul").setDescription("Milestone odulu").setMinValue(0).setRequired(false),
    ),
  async execute(client, interaction) {
    const fakeAccountDays = interaction.options.getInteger("fake_hesap_gun");
    const decrementOnLeave = interaction.options.getBoolean("cikista_dus");
    const milestoneReward = interaction.options.getInteger("esik_odul");

    patchGuildConfig(interaction.guildId, {
      community: {
        invites: {
          fakeAccountAgeMs: fakeAccountDays !== null ? fakeAccountDays * 24 * 60 * 60 * 1000 : undefined,
          decrementOnLeave: decrementOnLeave ?? undefined,
          milestoneReward: milestoneReward ?? undefined,
        },
      },
    });

    await interaction.reply({
      embeds: [successEmbed("Davet Sistemi Guncellendi", "Fake davet ve leave ayarlari kaydedildi.")],
      ephemeral: true,
    });
  },
};
