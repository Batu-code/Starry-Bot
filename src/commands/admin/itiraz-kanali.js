const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { patchGuildConfig } = require("../../data/store");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("itiraz-kanali")
    .setDescription("Ceza itirazlarinin gidecegi kanali ayarlar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option.setName("kanal").setDescription("Itiraz kanali").addChannelTypes(ChannelType.GuildText).setRequired(true),
    ),
  async execute(client, interaction) {
    const channel = interaction.options.getChannel("kanal", true);
    patchGuildConfig(interaction.guildId, {
      moderation: {
        appealChannelId: channel.id,
      },
    });
    await interaction.reply({ embeds: [successEmbed("Itiraz Kanali", `${channel} itiraz kanali olarak ayarlandi.`)], ephemeral: true });
  },
};

