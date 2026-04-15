const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { patchGuildConfig } = require("../../data/store");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("basvuru-kur")
    .setDescription("Yetkili, tasarimci ve ekip basvurulari sistemini ayarlar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option.setName("kategori").setDescription("Basvuru kanallari kategorisi").addChannelTypes(ChannelType.GuildCategory).setRequired(true),
    )
    .addRoleOption((option) =>
      option.setName("inceleme_rolu").setDescription("Basvurulari inceleyecek rol").setRequired(true),
    )
    .addChannelOption((option) =>
      option.setName("log_kanali").setDescription("Basvuru log kanali").addChannelTypes(ChannelType.GuildText).setRequired(false),
    ),
  async execute(client, interaction) {
    const category = interaction.options.getChannel("kategori", true);
    const reviewRole = interaction.options.getRole("inceleme_rolu", true);
    const logChannel = interaction.options.getChannel("log_kanali");

    patchGuildConfig(interaction.guildId, {
      community: {
        applications: {
          enabled: true,
          categoryId: category.id,
          reviewRoleId: reviewRole.id,
          logChannelId: logChannel?.id || null,
        },
      },
    });

    await interaction.reply({
      embeds: [successEmbed("Basvuru Sistemi Ayarlandi", "Basvuru kategorisi ve inceleme rolu kaydedildi.")],
      ephemeral: true,
    });
  },
};
