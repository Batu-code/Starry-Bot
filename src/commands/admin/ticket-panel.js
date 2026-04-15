const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const { ticketButtons } = require("../../modules/community/tickets");
const { successEmbed, infoEmbed } = require("../../utils/embeds");
const { patchGuildConfig } = require("../../data/store");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-paneli")
    .setDescription("Ticket acma panelini gonderir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(client, interaction) {
    patchGuildConfig(interaction.guildId, {
      community: {
        ticket: {
          panelChannelId: interaction.channelId,
        },
      },
    });

    await interaction.channel.send({
      embeds: [infoEmbed("Destek Merkezi", "Yeni destek talebi icin butona tikla, sonra ticket turunu sec.")],
      components: [ticketButtons()],
    });

    await interaction.reply({
      embeds: [successEmbed("Panel Gonderildi", "Ticket paneli bu kanala yerlestirildi.")],
      ephemeral: true,
    });
  },
};
