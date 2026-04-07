const { SlashCommandBuilder } = require("discord.js");
const { QueueRepeatMode } = require("discord-player");
const { successEmbed } = require("../../utils/embeds");
const { assertVoiceAccess, assertDjAccess } = require("../../modules/music/guards");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dongu")
    .setDescription("Dongu modunu ayarlar.")
    .addStringOption((option) =>
      option
        .setName("mod")
        .setDescription("Dongu modu")
        .setRequired(true)
        .addChoices(
          { name: "Kapali", value: "off" },
          { name: "Sarki", value: "track" },
          { name: "Kuyruk", value: "queue" },
        ),
    ),
  async execute(client, interaction) {
    const mode = interaction.options.getString("mod", true);
    const queue = client.player.nodes.get(interaction.guildId);
    if (!queue) {
      throw new Error("Aktif oynatici yok.");
    }

    assertVoiceAccess(interaction, queue);
    assertDjAccess(interaction);
    const repeatMode =
      mode === "track"
        ? QueueRepeatMode.TRACK
        : mode === "queue"
          ? QueueRepeatMode.QUEUE
          : QueueRepeatMode.OFF;

    queue.setRepeatMode(repeatMode);

    await interaction.reply({
      embeds: [successEmbed("Dongu Guncellendi", `Yeni mod: **${mode}**`)],
      ephemeral: true,
    });
  },
};
