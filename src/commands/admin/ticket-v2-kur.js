const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { patchGuildConfig } = require("../../data/store");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-v2-kur")
    .setDescription("Gelişmis ticket v2 sistemini ayarlar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option.setName("kategori").setDescription("Acik ticket kategorisi").addChannelTypes(ChannelType.GuildCategory).setRequired(true),
    )
    .addRoleOption((option) =>
      option.setName("destek_rolu").setDescription("Ticket ile ilgilenecek rol").setRequired(true),
    )
    .addChannelOption((option) =>
      option.setName("transcript_kanali").setDescription("HTML transcript kanali").addChannelTypes(ChannelType.GuildText).setRequired(false),
    )
    .addChannelOption((option) =>
      option.setName("arsiv_kategorisi").setDescription("Kapatilan ticket kategorisi").addChannelTypes(ChannelType.GuildCategory).setRequired(false),
    )
    .addChannelOption((option) =>
      option.setName("log_kanali").setDescription("Ticket log kanali").addChannelTypes(ChannelType.GuildText).setRequired(false),
    ),
  async execute(client, interaction) {
    const category = interaction.options.getChannel("kategori", true);
    const supportRole = interaction.options.getRole("destek_rolu", true);
    const transcriptChannel = interaction.options.getChannel("transcript_kanali");
    const archiveCategory = interaction.options.getChannel("arsiv_kategorisi");
    const logChannel = interaction.options.getChannel("log_kanali");

    patchGuildConfig(interaction.guildId, {
      community: {
        ticket: {
          categoryId: category.id,
          supportRoleId: supportRole.id,
          transcriptChannelId: transcriptChannel?.id || null,
          archiveCategoryId: archiveCategory?.id || null,
          logChannelId: logChannel?.id || null,
        },
      },
    });

    await interaction.reply({
      embeds: [successEmbed("Ticket v2 Ayarlandi", "Gelişmis ticket sistemi aktif edildi.")],
      ephemeral: true,
    });
  },
};
