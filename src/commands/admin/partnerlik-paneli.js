const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { partnershipButtons } = require("../../modules/community/partnerships");
const { patchGuildConfig } = require("../../data/store");
const { infoEmbed, successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("partnerlik-paneli")
    .setDescription("Partnerlik basvuru panelini bu kanala gonderir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(client, interaction) {
    patchGuildConfig(interaction.guildId, {
      community: {
        partnership: {
          panelChannelId: interaction.channelId,
        },
      },
    });

    await interaction.channel.send({
      embeds: [
        infoEmbed(
          "Partnerlik Basvurusu",
          "Sunucunuzla partner olmak istiyorsaniz butona tiklayip detayli basvurunuzu gonderebilirsiniz.",
        ),
      ],
      components: [partnershipButtons()],
    });

    await interaction.reply({
      embeds: [successEmbed("Partnerlik Paneli", "Partnerlik paneli bu kanala gonderildi.")],
      ephemeral: true,
    });
  },
};

