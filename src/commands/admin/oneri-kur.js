const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { patchGuildConfig } = require("../../data/store");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("oneri-kur")
    .setDescription("Oneri ve sikayet sistemini ayarlar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option.setName("oneri_kanali").setDescription("Onerilerin dusecegi kanal").addChannelTypes(ChannelType.GuildText).setRequired(true),
    )
    .addChannelOption((option) =>
      option.setName("sikayet_kanali").setDescription("Sikayetlerin dusecegi kanal").addChannelTypes(ChannelType.GuildText).setRequired(true),
    )
    .addRoleOption((option) =>
      option.setName("inceleme_rolu").setDescription("Oneri/sikayet inceleme rolu").setRequired(false),
    )
    .addChannelOption((option) =>
      option.setName("log_kanali").setDescription("Olay log kanali").addChannelTypes(ChannelType.GuildText).setRequired(false),
    ),
  async execute(client, interaction) {
    const suggestionChannel = interaction.options.getChannel("oneri_kanali", true);
    const complaintChannel = interaction.options.getChannel("sikayet_kanali", true);
    const reviewRole = interaction.options.getRole("inceleme_rolu");
    const logChannel = interaction.options.getChannel("log_kanali");

    patchGuildConfig(interaction.guildId, {
      community: {
        feedback: {
          enabled: true,
          suggestionChannelId: suggestionChannel.id,
          complaintChannelId: complaintChannel.id,
          reviewRoleId: reviewRole?.id || null,
          logChannelId: logChannel?.id || null,
        },
      },
    });

    await interaction.reply({
      embeds: [successEmbed("Oneri Sistemi Ayarlandi", "Oneri ve sikayet kanallari kaydedildi.")],
      ephemeral: true,
    });
  },
};
