const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { patchGuildConfig } = require("../../data/store");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ai-kur")
    .setDescription("AI destek asistani ayarlarini yapar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option.setName("kanal").setDescription("AI destek kanali").addChannelTypes(ChannelType.GuildText).setRequired(true),
    )
    .addRoleOption((option) =>
      option.setName("yardimci_rolu").setDescription("AI destek ekibi rolu").setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("otomatik")
        .setDescription("Kanalda otomatik cevap aktif olsun mu")
        .setRequired(false)
        .addChoices(
          { name: "Ac", value: "on" },
          { name: "Kapat", value: "off" },
        ),
    ),
  async execute(client, interaction) {
    const channel = interaction.options.getChannel("kanal", true);
    const helperRole = interaction.options.getRole("yardimci_rolu");
    const auto = interaction.options.getString("otomatik");

    patchGuildConfig(interaction.guildId, {
      community: {
        ai: {
          enabled: true,
          channelId: channel.id,
          helperRoleId: helperRole?.id || null,
          autoReplyEnabled: auto ? auto === "on" : false,
        },
      },
    });

    await interaction.reply({
      embeds: [successEmbed("AI Ayarlandi", `${channel} AI destek kanali olarak ayarlandi.`)],
      ephemeral: true,
    });
  },
};

