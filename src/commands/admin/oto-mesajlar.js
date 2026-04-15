const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { listAutoMessages } = require("../../modules/community/autoMessages");
const { infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("oto-mesajlar")
    .setDescription("Kayitli oto mesajlari listeler.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(client, interaction) {
    const items = listAutoMessages(interaction.guildId);
    const lines = items.length
      ? items.map((item) => `**${item.id}** - <#${item.channelId}> - ${item.intervalMinutes} dk`).join("\n")
      : "Kayitli oto mesaj yok.";

    await interaction.reply({
      embeds: [infoEmbed("Oto Mesajlar", lines)],
      ephemeral: true,
    });
  },
};
