const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");
const { getGuildConfig, patchGuildConfig } = require("../../data/store");
const { sendLog } = require("../logging/sendLog");
const { COLORS } = require("../../constants");

function ticketButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_open")
      .setLabel("Destek Talebi Ac")
      .setStyle(ButtonStyle.Primary),
  );
}

function activeTicketButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_claim")
      .setLabel("Ticketi Ustlen")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("Ticketi Kapat")
      .setStyle(ButtonStyle.Danger),
  );
}

async function createTicketChannel(interaction) {
  const guildConfig = getGuildConfig(interaction.guildId);
  const ticketConfig = guildConfig.community.ticket;

  if (!ticketConfig.categoryId || !ticketConfig.supportRoleId) {
    throw new Error("Ticket sistemi tam yapilandirilmamis.");
  }

  const existing = interaction.guild.channels.cache.find(
    (channel) => channel.topic === `ticket-owner:${interaction.user.id}`,
  );

  if (existing) {
    return existing;
  }

  const ticketNumber = ticketConfig.counter + 1;
  const channel = await interaction.guild.channels.create({
    name: `ticket-${ticketNumber}`,
    type: ChannelType.GuildText,
    parent: ticketConfig.categoryId,
    topic: `ticket-owner:${interaction.user.id}`,
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

  await channel.send({
    content: `${interaction.user} destek talebin olusturuldu. Yetkililer en kisa surede ilgilenecek.`,
    components: [activeTicketButtons()],
  });

  await sendLog(interaction.guild, {
    color: COLORS.primary,
    title: "Ticket Acildi",
    description: `${interaction.user.tag} yeni bir ticket olusturdu.`,
    fields: [{ name: "Kanal", value: `${channel}`, inline: true }],
  });

  return channel;
}

async function closeTicket(interaction) {
  const guildConfig = getGuildConfig(interaction.guildId);
  const ticketConfig = guildConfig.community.ticket;
  const transcriptChannel = ticketConfig.transcriptChannelId
    ? await interaction.guild.channels.fetch(ticketConfig.transcriptChannelId).catch(() => null)
    : null;

  const messages = await interaction.channel.messages.fetch({ limit: 100 }).catch(() => null);
  if (transcriptChannel?.isTextBased() && messages) {
    const lines = [...messages.values()]
      .reverse()
      .map((message) => `[${new Date(message.createdTimestamp).toISOString()}] ${message.author.tag}: ${message.content}`)
      .join("\n")
      .slice(0, 180000);

    await transcriptChannel.send({
      content: `Ticket arsivi: ${interaction.channel.name}`,
      files: [{ attachment: Buffer.from(lines || "Bos transcript", "utf8"), name: `${interaction.channel.name}.txt` }],
    }).catch(() => null);
  }

  await sendLog(interaction.guild, {
    color: COLORS.warning,
    title: "Ticket Kapatildi",
    description: `${interaction.user.tag} bir ticket kapatti.`,
    fields: [{ name: "Kanal", value: interaction.channel.name, inline: true }],
  });

  await interaction.channel.delete("Ticket kapatildi").catch(() => null);
}

module.exports = {
  ticketButtons,
  activeTicketButtons,
  createTicketChannel,
  closeTicket,
};

