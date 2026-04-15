const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ModalBuilder,
  PermissionsBitField,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const { getGuildConfig, patchGuildConfig } = require("../../data/store");
const { sendLog } = require("../logging/sendLog");
const { COLORS } = require("../../constants");
const { recordStaffAction } = require("./staffStats");

function getTicketConfig(guildId) {
  return getGuildConfig(guildId).community.ticket;
}

function ticketButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_open")
      .setLabel("Destek Talebi Ac")
      .setStyle(ButtonStyle.Primary),
  );
}

function buildTicketTypeButtons(guildId) {
  const config = getTicketConfig(guildId);
  const rows = [];
  let row = new ActionRowBuilder();

  for (const [index, type] of (config.types || []).slice(0, 5).entries()) {
    if (index > 0 && index % 5 === 0) {
      rows.push(row);
      row = new ActionRowBuilder();
    }

    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_type:${type.id}`)
        .setLabel(type.label.slice(0, 80))
        .setStyle(ButtonStyle.Secondary),
    );
  }

  if (row.components.length) {
    rows.push(row);
  }

  return rows;
}

function activeTicketButtons(ticketId, claimedBy = null) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket_claim:${ticketId}`)
      .setLabel(claimedBy ? "Ustlenildi" : "Ticketi Ustlen")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(Boolean(claimedBy)),
    new ButtonBuilder()
      .setCustomId(`ticket_close:${ticketId}`)
      .setLabel("Ticketi Kapat")
      .setStyle(ButtonStyle.Danger),
  );
}

function buildTicketModal(typeId, label) {
  const modal = new ModalBuilder()
    .setCustomId(`ticket_modal:${typeId}`)
    .setTitle(`${label} Talebi`.slice(0, 45));

  const subject = new TextInputBuilder()
    .setCustomId("ticket_subject")
    .setLabel("Kisa konu")
    .setStyle(TextInputStyle.Short)
    .setMaxLength(100)
    .setRequired(true);

  const body = new TextInputBuilder()
    .setCustomId("ticket_body")
    .setLabel("Sorun veya detay")
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(1000)
    .setRequired(true);

  const contact = new TextInputBuilder()
    .setCustomId("ticket_contact")
    .setLabel("Ek bilgi / iletisim")
    .setStyle(TextInputStyle.Short)
    .setMaxLength(100)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(subject),
    new ActionRowBuilder().addComponents(body),
    new ActionRowBuilder().addComponents(contact),
  );

  return modal;
}

function assertTicketReady(guildId) {
  const ticketConfig = getTicketConfig(guildId);
  if (!ticketConfig.categoryId || !ticketConfig.supportRoleId) {
    throw new Error("Ticket sistemi tam yapilandirilmamis.");
  }

  return ticketConfig;
}

function updateRecords(guildId, records) {
  patchGuildConfig(guildId, {
    community: {
      ticket: {
        records,
      },
    },
  });
}

function setRecord(guildId, recordId, record) {
  const config = getTicketConfig(guildId);
  updateRecords(guildId, {
    ...(config.records || {}),
    [recordId]: record,
  });
}

function getTicketByChannel(guildId, channelId) {
  const config = getTicketConfig(guildId);
  return Object.values(config.records || {}).find((entry) => entry.channelId === channelId) || null;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function fetchTranscriptHtml(channel) {
  let lastId = null;
  const allMessages = [];

  for (let index = 0; index < 4; index += 1) {
    const batch = await channel.messages.fetch({ limit: 50, before: lastId }).catch(() => null);
    if (!batch || batch.size === 0) {
      break;
    }

    allMessages.push(...batch.values());
    lastId = batch.last().id;
  }

  const messages = allMessages.sort((left, right) => left.createdTimestamp - right.createdTimestamp);
  const body = messages.map((message) => {
    const content = escapeHtml(message.content || "[Medya veya embed]");
    return `
      <article class="msg">
        <header>
          <strong>${escapeHtml(message.author.tag)}</strong>
          <span>${new Date(message.createdTimestamp).toLocaleString("tr-TR")}</span>
        </header>
        <pre>${content}</pre>
      </article>`;
  }).join("\n");

  return `<!doctype html>
  <html lang="tr">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(channel.name)} transcript</title>
      <style>
        body { font-family: Segoe UI, sans-serif; background:#0f1722; color:#eef3f8; padding:24px; }
        .msg { background:#162232; border:1px solid #24364e; border-radius:16px; padding:16px; margin-bottom:12px; }
        header { display:flex; justify-content:space-between; gap:16px; color:#9fb5cc; margin-bottom:8px; }
        pre { white-space:pre-wrap; word-break:break-word; margin:0; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(channel.name)} transcript</h1>
      ${body || "<p>Mesaj bulunamadi.</p>"}
    </body>
  </html>`;
}

async function createTicketChannel(interaction, typeId = null) {
  const ticketConfig = assertTicketReady(interaction.guildId);
  const selectedType = (ticketConfig.types || []).find((entry) => entry.id === typeId) || ticketConfig.types?.[0] || { id: "destek", label: "Destek" };

  const existing = Object.values(ticketConfig.records || {}).find(
    (entry) => entry.ownerId === interaction.user.id && entry.status === "open",
  );
  if (existing) {
    const channel = interaction.guild.channels.cache.get(existing.channelId);
    if (channel) {
      return channel;
    }
  }

  const subject = interaction.fields?.getTextInputValue("ticket_subject")?.trim() || selectedType.label;
  const body = interaction.fields?.getTextInputValue("ticket_body")?.trim() || "Detay eklenmedi.";
  const contact = interaction.fields?.getTextInputValue("ticket_contact")?.trim() || "Yok";
  const ticketNumber = ticketConfig.counter + 1;
  const recordId = `ticket-${Date.now()}`;
  const channel = await interaction.guild.channels.create({
    name: `ticket-${ticketNumber}`,
    type: ChannelType.GuildText,
    parent: ticketConfig.categoryId,
    topic: `ticket-owner:${interaction.user.id}:${recordId}`,
    permissionOverwrites: [
      {
        id: interaction.guild.roles.everyone.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
        ],
      },
      {
        id: ticketConfig.supportRoleId,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.ManageChannels,
        ],
      },
    ],
  });

  patchGuildConfig(interaction.guildId, {
    community: {
      ticket: {
        ...ticketConfig,
        counter: ticketNumber,
      },
    },
  });

  const record = {
    id: recordId,
    typeId: selectedType.id,
    typeLabel: selectedType.label,
    ownerId: interaction.user.id,
    channelId: channel.id,
    subject,
    body,
    contact,
    claimedBy: null,
    createdAt: Date.now(),
    status: "open",
  };
  setRecord(interaction.guildId, recordId, record);

  await channel.send({
    content: `${interaction.user} ticketin olusturuldu. <@&${ticketConfig.supportRoleId}> ilgilenecek.`,
    embeds: [
      {
        color: COLORS.primary,
        title: `${selectedType.label} Ticket`,
        description: body,
        fields: [
          { name: "Konu", value: subject.slice(0, 1024), inline: false },
          { name: "Iletisim", value: contact.slice(0, 1024), inline: true },
          { name: "Sahip", value: `${interaction.user}`, inline: true },
        ],
      },
    ],
    components: [activeTicketButtons(recordId)],
  });

  await sendLog(interaction.guild, {
    channelId: ticketConfig.logChannelId || undefined,
    color: COLORS.primary,
    title: "Ticket Acildi",
    description: `${interaction.user.tag} yeni bir ticket olusturdu.`,
    fields: [
      { name: "Kanal", value: `${channel}`, inline: true },
      { name: "Tur", value: selectedType.label, inline: true },
    ],
  });

  return channel;
}

async function claimTicket(interaction, recordId) {
  const record = getTicketByChannel(interaction.guildId, interaction.channelId);
  if (!record || (recordId && record.id !== recordId)) {
    throw new Error("Bu ticket kaydi bulunamadi.");
  }
  if (record.claimedBy) {
    throw new Error("Bu ticket zaten ustlenilmis.");
  }

  const next = {
    ...record,
    claimedBy: interaction.user.id,
    claimedAt: Date.now(),
  };
  setRecord(interaction.guildId, record.id, next);
  recordStaffAction(interaction.guildId, interaction.user.id, "ticketClaim", { ticketId: record.id });

  await interaction.message.edit({
    components: [activeTicketButtons(record.id, interaction.user.id)],
  }).catch(() => null);
}

async function closeTicket(interaction, recordId = null) {
  const guildConfig = getGuildConfig(interaction.guildId);
  const ticketConfig = guildConfig.community.ticket;
  const record = getTicketByChannel(interaction.guildId, interaction.channelId);
  if (!record || (recordId && record.id !== recordId)) {
    throw new Error("Ticket kaydi bulunamadi.");
  }

  const transcriptChannel = ticketConfig.transcriptChannelId
    ? await interaction.guild.channels.fetch(ticketConfig.transcriptChannelId).catch(() => null)
    : null;

  const html = await fetchTranscriptHtml(interaction.channel);
  const plainText = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (transcriptChannel?.isTextBased()) {
    await transcriptChannel.send({
      content: `Ticket arsivi: ${interaction.channel.name}`,
      files: [
        { attachment: Buffer.from(html, "utf8"), name: `${interaction.channel.name}.html` },
        { attachment: Buffer.from(plainText || "Bos transcript", "utf8"), name: `${interaction.channel.name}.txt` },
      ],
    }).catch(() => null);
  }

  const closedRecord = {
    ...record,
    status: "closed",
    closedBy: interaction.user.id,
    closedAt: Date.now(),
  };
  setRecord(interaction.guildId, record.id, closedRecord);
  recordStaffAction(interaction.guildId, interaction.user.id, "ticketClose", { ticketId: record.id });

  await sendLog(interaction.guild, {
    channelId: ticketConfig.logChannelId || undefined,
    color: COLORS.warning,
    title: "Ticket Kapatildi",
    description: `${interaction.user.tag} bir ticket kapatti.`,
    fields: [{ name: "Kanal", value: interaction.channel.name, inline: true }],
  });

  if (ticketConfig.archiveCategoryId) {
    await interaction.channel.setParent(ticketConfig.archiveCategoryId).catch(() => null);
    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      ViewChannel: false,
    }).catch(() => null);
    await interaction.channel.permissionOverwrites.edit(record.ownerId, {
      ViewChannel: false,
    }).catch(() => null);
    await interaction.channel.setName(`kapali-${interaction.channel.name}`.slice(0, 90)).catch(() => null);
    return;
  }

  await interaction.channel.delete("Ticket kapatildi").catch(() => null);
}

module.exports = {
  ticketButtons,
  buildTicketTypeButtons,
  activeTicketButtons,
  buildTicketModal,
  createTicketChannel,
  claimTicket,
  closeTicket,
};
