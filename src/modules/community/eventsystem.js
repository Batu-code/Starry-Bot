const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getGuildConfig, patchGuildConfig } = require("../../data/store");
const { sendLog } = require("../logging/sendLog");
const { COLORS } = require("../../constants");
const { formatDuration } = require("../../utils/time");

function getEvents(guildId) {
  return getGuildConfig(guildId).community.events.items || {};
}

function saveEvents(guildId, items) {
  patchGuildConfig(guildId, {
    community: {
      events: {
        items,
      },
    },
  });
}

function eventButtons(eventId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`event_join:${eventId}`)
      .setLabel("Katil")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`event_leave:${eventId}`)
      .setLabel("Ayril")
      .setStyle(ButtonStyle.Secondary),
  );
}

function buildEventMessage(event) {
  return [
    `**Etkinlik:** ${event.title}`,
    `Saat: <t:${Math.floor(event.startsAt / 1000)}:F>`,
    `Katilimci: **${(event.attendees || []).length}**`,
    `Ayrinti: ${event.description}`,
  ].join("\n");
}

async function createEvent(interaction, payload) {
  const items = getEvents(interaction.guildId);
  const eventId = `event-${Date.now()}`;
  items[eventId] = {
    id: eventId,
    createdBy: interaction.user.id,
    createdAt: Date.now(),
    reminded: false,
    attendees: [],
    ...payload,
  };
  saveEvents(interaction.guildId, items);

  const message = await interaction.channel.send({
    content: buildEventMessage(items[eventId]),
    components: [eventButtons(eventId)],
  });

  items[eventId].messageId = message.id;
  items[eventId].channelId = interaction.channelId;
  saveEvents(interaction.guildId, items);

  await sendLog(interaction.guild, {
    color: COLORS.primary,
    title: "Etkinlik Olusturuldu",
    description: `${payload.title} etkinligi planlandi.`,
    fields: [
      { name: "Baslangic", value: `<t:${Math.floor(payload.startsAt / 1000)}:R>`, inline: true },
      { name: "Olusturan", value: `<@${interaction.user.id}>`, inline: true },
    ],
  });

  return items[eventId];
}

function updateEventAttendance(guildId, eventId, userId, join) {
  const items = getEvents(guildId);
  const event = items[eventId];
  if (!event) {
    throw new Error("Etkinlik bulunamadi.");
  }

  const attendees = new Set(event.attendees || []);
  if (join) attendees.add(userId);
  else attendees.delete(userId);
  event.attendees = [...attendees];
  items[eventId] = event;
  saveEvents(guildId, items);
  return event;
}

async function processEventReminders(client) {
  for (const guild of client.guilds.cache.values()) {
    const items = getEvents(guild.id);
    let changed = false;
    for (const event of Object.values(items)) {
      const msLeft = event.startsAt - Date.now();
      if (!event.reminded && msLeft > 0 && msLeft <= 30 * 60 * 1000) {
        const channel = await guild.channels.fetch(event.channelId).catch(() => null);
        if (channel?.isTextBased()) {
          await channel.send({
            content: `**Hatirlatma:** ${event.title} ${formatDuration(msLeft)} sonra basliyor.\nKatilimcilar: ${(event.attendees || []).length ? event.attendees.map((id) => `<@${id}>`).join(", ") : "Yok"}`,
          }).catch(() => null);
        }
        event.reminded = true;
        changed = true;
      }
    }
    if (changed) {
      saveEvents(guild.id, items);
    }
  }
}

module.exports = {
  getEvents,
  createEvent,
  updateEventAttendance,
  processEventReminders,
  eventButtons,
  buildEventMessage,
};
