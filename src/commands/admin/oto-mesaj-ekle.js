const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { addAutoMessage } = require("../../modules/community/autoMessages");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("oto-mesaj-ekle")
    .setDescription("Belirli araliklarla otomatik mesaj yollar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((option) =>
      option
        .setName("kanal")
        .setDescription("Mesajin gidecegi kanal")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("dakika")
        .setDescription("Kac dakikada bir gonderilsin")
        .setMinValue(5)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("mesaj").setDescription("Oto mesaj icerigi").setRequired(true),
    ),
  async execute(client, interaction) {
    const entry = addAutoMessage(interaction.guildId, {
      channelId: interaction.options.getChannel("kanal", true).id,
      intervalMinutes: interaction.options.getInteger("dakika", true),
      content: interaction.options.getString("mesaj", true),
    });

    await interaction.reply({
      embeds: [successEmbed("Oto Mesaj Eklendi", `ID: **${entry.id}** olarak kaydedildi.`)],
      ephemeral: true,
    });
  },
};
