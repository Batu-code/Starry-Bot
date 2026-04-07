const { SlashCommandBuilder } = require("discord.js");
const { addReminder } = require("../../modules/community/reminders");
const { parseDuration, formatDuration } = require("../../utils/time");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hatirlat")
    .setDescription("Kendine hatirlatma kurar.")
    .addStringOption((option) =>
      option
        .setName("sure")
        .setDescription("Ornek: 10dk, 2sa, 1g")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("mesaj").setDescription("Hatirlatma metni").setRequired(true),
    ),
  async execute(client, interaction) {
    const durationInput = interaction.options.getString("sure", true);
    const message = interaction.options.getString("mesaj", true);
    const durationMs = parseDuration(durationInput);

    if (!durationMs) {
      throw new Error("Gecerli bir sure gir. Ornek: 15dk, 2sa, 1g");
    }

    addReminder({
      id: `${Date.now()}-${interaction.user.id}`,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      userId: interaction.user.id,
      message,
      triggerAt: Date.now() + durationMs,
    });

    await interaction.reply({
      embeds: [successEmbed("Hatirlatma Kuruldu", `${formatDuration(durationMs)} sonra hatirlatacagim.`)],
      ephemeral: true,
    });
  },
};
