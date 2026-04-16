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
      embeds: [
        infoEmbed(
          "Destek Merkezi",
          "Herhangi bir konuda birini bildirmek veya bir konuda soru sormak isterseniz Destek Talebi Acarak sorularinizi veya sorunlarinizi giderebilirsiniz.\nNOT: Eger ticket bosu bosuna acilirsa acan kisiye yaptirim uygulanir bilginize.",
        ),
      ],
      components: [ticketButtons()],
    });

    await interaction.reply({
      embeds: [successEmbed("Panel Gonderildi", "Ticket paneli bu kanala yerlestirildi.")],
      ephemeral: true,
    });
  },
};
