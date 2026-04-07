const { SlashCommandBuilder } = require("discord.js");
const { getEvents } = require("../../modules/community/eventsystem");
const { infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("etkinlikler")
    .setDescription("Planli etkinlikleri listeler."),
  async execute(client, interaction) {
    const items = Object.values(getEvents(interaction.guildId))
      .sort((a, b) => a.startsAt - b.startsAt)
      .slice(0, 10);
    const text = items.length
      ? items.map((event) => `**${event.title}** - <t:${Math.floor(event.startsAt / 1000)}:R> - ${event.attendees.length} katilimci`).join("\n")
      : "Planli etkinlik yok.";
    await interaction.reply({ embeds: [infoEmbed("Etkinlikler", text)], ephemeral: true });
  },
};

