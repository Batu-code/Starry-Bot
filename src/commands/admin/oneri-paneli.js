const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { patchGuildConfig } = require("../../data/store");
const { panelButtons } = require("../../modules/community/feedback");
const { infoEmbed, successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("oneri-paneli")
    .setDescription("Oneri ve sikayet panelini gonderir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(client, interaction) {
    patchGuildConfig(interaction.guildId, {
      community: {
        feedback: {
          panelChannelId: interaction.channelId,
        },
      },
    });

    await interaction.channel.send({
      embeds: [infoEmbed("Topluluk Geri Bildirimi", "Oneri ve sikayetlerini butonlarla iletebilirsin.")],
      components: panelButtons(),
    });

    await interaction.reply({
      embeds: [successEmbed("Oneri Paneli", "Panel bu kanala gonderildi.")],
      ephemeral: true,
    });
  },
};
