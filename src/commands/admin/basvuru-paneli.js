const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { patchGuildConfig, getGuildConfig } = require("../../data/store");
const { buildApplicationButtons } = require("../../modules/community/applications");
const { infoEmbed, successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("basvuru-paneli")
    .setDescription("Basvuru panelini gonderir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(client, interaction) {
    patchGuildConfig(interaction.guildId, {
      community: {
        applications: {
          panelChannelId: interaction.channelId,
        },
      },
    });

    const types = getGuildConfig(interaction.guildId).community.applications.types;
    await interaction.channel.send({
      embeds: [infoEmbed("Basvuru Merkezi", "Asagidan uygun basvuru tipini secip formu doldurabilirsin.")],
      components: buildApplicationButtons(types),
    });

    await interaction.reply({
      embeds: [successEmbed("Basvuru Paneli", "Basvuru paneli bu kanala gonderildi.")],
      ephemeral: true,
    });
  },
};
