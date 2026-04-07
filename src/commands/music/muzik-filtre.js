const { SlashCommandBuilder } = require("discord.js");
const { successEmbed } = require("../../utils/embeds");
const { assertVoiceAccess, assertDjAccess } = require("../../modules/music/guards");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("muzik-filtre")
    .setDescription("Ses filtresi uygular.")
    .addStringOption((option) =>
      option
        .setName("filtre")
        .setDescription("Uygulanacak filtre")
        .setRequired(true)
        .addChoices(
          { name: "Kapali", value: "off" },
          { name: "Bassboost", value: "bassboost" },
          { name: "Nightcore", value: "nightcore" },
          { name: "8D", value: "8D" },
          { name: "Vaporwave", value: "vaporwave" },
        ),
    ),
  async execute(client, interaction) {
    const queue = client.player.nodes.get(interaction.guildId);
    if (!queue) {
      throw new Error("Aktif oynatici yok.");
    }

    assertVoiceAccess(interaction, queue);
    assertDjAccess(interaction);

    const filter = interaction.options.getString("filtre", true);
    if (filter === "off") {
      await queue.filters.ffmpeg.setFilters([]);
    } else {
      await queue.filters.ffmpeg.setFilters([filter]);
    }

    await interaction.reply({
      embeds: [successEmbed("Filtre Guncellendi", `Aktif filtre: **${filter}**`)],
      ephemeral: true,
    });
  },
};

