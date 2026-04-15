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

function getSettings(guildId) {
  return getGuildConfig(guildId).community.applications;
}

function assertApplicationReady(guildId) {
  const settings = getSettings(guildId);
  if (!settings.enabled || !settings.categoryId || !settings.reviewRoleId) {
    throw new Error("Basvuru sistemi tam yapilandirilmamis.");
  }
  return settings;
}

function buildApplicationButtons(types) {
  const rows = [];
  let row = new ActionRowBuilder();

  for (const [index, type] of types.slice(0, 5).entries()) {
    if (index > 0 && index % 5 === 0) {
      rows.push(row);
      row = new ActionRowBuilder();
    }

    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`application_open:${type.id}`)
        .setLabel(type.label.slice(0, 80))
        .setStyle(ButtonStyle.Primary),
    );
  }

  if (row.components.length) {
    rows.push(row);
  }

  return rows;
}

function applicationReviewButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("application_approve")
      .setLabel("Onayla")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("application_reject")
      .setLabel("Reddet")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("application_close")
      .setLabel("Arsivle")
      .setStyle(ButtonStyle.Secondary),
  );
}

function buildApplicationModal(typeId, label) {
  const modal = new ModalBuilder()
    .setCustomId(`application_modal:${typeId}`)
    .setTitle(`${label} Formu`.slice(0, 45));

  const name = new TextInputBuilder()
    .setCustomId("application_name")
    .setLabel("Adin veya kullandigin isim")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

  const experience = new TextInputBuilder()
    .setCustomId("application_experience")
    .setLabel("Deneyimin / gecmisin")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(1000);

  const motivation = new TextInputBuilder()
    .setCustomId("application_motivation")
    .setLabel("Neden seni secmeliyiz")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(1000);

  const availability = new TextInputBuilder()
    .setCustomId("application_availability")
    .setLabel("Gunluk aktiflik / musaitlik")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

  modal.addComponents(
    new ActionRowBuilder().addComponents(name),
    new ActionRowBuilder().addComponents(experience),
    new ActionRowBuilder().addComponents(motivation),
    new ActionRowBuilder().addComponents(availability),
  );

  return modal;
}

function updateRecords(guildId, records) {
  patchGuildConfig(guildId, {
    community: {
      applications: {
        records,
      },
    },
  });
}

function getRecordByChannel(guildId, channelId) {
  const records = getSettings(guildId).records || {};
  return Object.values(records).find((entry) => entry.channelId === channelId && entry.status === "open") || null;
}

function setRecord(guildId, id, value) {
  const settings = getSettings(guildId);
  updateRecords(guildId, {
    ...(settings.records || {}),
    [id]: value,
  });
}

async function createApplication(interaction, typeId) {
  const settings = assertApplicationReady(interaction.guildId);
  const type = (settings.types || []).find((entry) => entry.id === typeId);
  if (!type) {
    throw new Error("Basvuru tipi bulunamadi.");
  }

  const existing = Object.values(settings.records || {}).find(
    (entry) => entry.ownerId === interaction.user.id && entry.status === "open",
  );
  if (existing) {
    const channel = interaction.guild.channels.cache.get(existing.channelId);
    if (channel) {
      return channel;
    }
  }

  const number = settings.counter + 1;
  const subject = interaction.fields.getTextInputValue("application_name").trim();
  const experience = interaction.fields.getTextInputValue("application_experience").trim();
  const motivation = interaction.fields.getTextInputValue("application_motivation").trim();
  const availability = interaction.fields.getTextInputValue("application_availability").trim();

  const channel = await interaction.guild.channels.create({
    name: `basvuru-${number}`,
    type: ChannelType.GuildText,
    parent: settings.categoryId,
    topic: `application-owner:${interaction.user.id}:${typeId}`,
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
        id: settings.reviewRoleId,
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
      applications: {
        ...settings,
        counter: number,
      },
    },
  });

  const record = {
    id: `application-${Date.now()}`,
    typeId,
    typeLabel: type.label,
    ownerId: interaction.user.id,
    channelId: channel.id,
    subject,
    experience,
    motivation,
    availability,
    status: "open",
    createdAt: Date.now(),
  };
  setRecord(interaction.guildId, record.id, record);

  await channel.send({
    content: `<@&${settings.reviewRoleId}> yeni bir ${type.label.toLowerCase()} geldi.`,
    embeds: [
      {
        color: COLORS.primary,
        title: `${type.label}`,
        description: `${interaction.user} yeni basvuru gonderdi.`,
        fields: [
          { name: "Isim", value: subject.slice(0, 1024), inline: true },
          { name: "Musaitlik", value: availability.slice(0, 1024), inline: true },
          { name: "Deneyim", value: experience.slice(0, 1024), inline: false },
          { name: "Motivasyon", value: motivation.slice(0, 1024), inline: false },
        ],
      },
    ],
    components: [applicationReviewButtons()],
  }).catch(() => null);

  await sendLog(interaction.guild, {
    channelId: settings.logChannelId || undefined,
    color: COLORS.primary,
    title: "Basvuru Acildi",
    description: `${interaction.user.tag} yeni bir ${type.label.toLowerCase()} gonderdi.`,
    fields: [{ name: "Kanal", value: `${channel}`, inline: true }],
  });

  return channel;
}

function isApplicationReviewer(interaction) {
  const settings = getSettings(interaction.guildId);
  if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
    return true;
  }

  return Boolean(settings.reviewRoleId && interaction.member.roles.cache.has(settings.reviewRoleId));
}

async function archiveApplicationChannel(channel, ownerId = null) {
  await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
    ViewChannel: false,
  }).catch(() => null);
  if (ownerId) {
    await channel.permissionOverwrites.edit(ownerId, {
      ViewChannel: false,
    }).catch(() => null);
  }
}

async function reviewApplication(interaction, status) {
  const settings = assertApplicationReady(interaction.guildId);
  const record = getRecordByChannel(interaction.guildId, interaction.channelId);
  if (!record) {
    throw new Error("Bu kanal aktif basvuru kanali degil.");
  }

  const next = {
    ...record,
    status,
    reviewedBy: interaction.user.id,
    reviewedAt: Date.now(),
  };
  setRecord(interaction.guildId, record.id, next);

  await archiveApplicationChannel(interaction.channel, record.ownerId);
  await interaction.message.edit({ components: [] }).catch(() => null);
  await interaction.channel.send({
    content: `${status === "approved" ? "Onaylandi" : "Reddedildi"}: <@${record.ownerId}>`,
  }).catch(() => null);

  recordStaffAction(
    interaction.guildId,
    interaction.user.id,
    status === "approved" ? "applicationApprove" : "applicationReject",
    { applicationId: record.id, typeId: record.typeId },
  );

  await sendLog(interaction.guild, {
    channelId: settings.logChannelId || undefined,
    color: status === "approved" ? COLORS.success : COLORS.warning,
    title: status === "approved" ? "Basvuru Onaylandi" : "Basvuru Reddedildi",
    description: `${record.typeLabel} degerlendirildi.`,
    fields: [
      { name: "Yetkili", value: `<@${interaction.user.id}>`, inline: true },
      { name: "Basvuru Sahibi", value: `<@${record.ownerId}>`, inline: true },
    ],
  });
}

async function closeApplicationChannel(interaction) {
  const settings = assertApplicationReady(interaction.guildId);
  const record = getRecordByChannel(interaction.guildId, interaction.channelId);
  if (!record) {
    throw new Error("Bu kanal aktif basvuru kanali degil.");
  }

  setRecord(interaction.guildId, record.id, {
    ...record,
    status: "archived",
    reviewedBy: interaction.user.id,
    reviewedAt: Date.now(),
  });

  await archiveApplicationChannel(interaction.channel, record.ownerId);
  await interaction.message.edit({ components: [] }).catch(() => null);
  await sendLog(interaction.guild, {
    channelId: settings.logChannelId || undefined,
    color: COLORS.muted,
    title: "Basvuru Arsivlendi",
    description: `${record.typeLabel} kanali arsivlendi.`,
  });
}

module.exports = {
  buildApplicationButtons,
  buildApplicationModal,
  createApplication,
  isApplicationReviewer,
  reviewApplication,
  closeApplicationChannel,
};
