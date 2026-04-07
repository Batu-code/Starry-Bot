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
const { grantBadge } = require("../progression/profiles");

function partnershipButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("partnership_open")
      .setLabel("Partnerlik Basvurusu Yap")
      .setStyle(ButtonStyle.Primary),
  );
}

function partnershipReviewButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("partnership_approve")
      .setLabel("Onayla")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("partnership_reject")
      .setLabel("Reddet")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("partnership_close")
      .setLabel("Arsivle")
      .setStyle(ButtonStyle.Secondary),
  );
}

function buildPartnershipModal() {
  const modal = new ModalBuilder()
    .setCustomId("partnership_modal")
    .setTitle("Partnerlik Basvurusu");

  const serverName = new TextInputBuilder()
    .setCustomId("server_name")
    .setLabel("Sunucu adi")
    .setStyle(TextInputStyle.Short)
    .setMaxLength(100)
    .setRequired(true);

  const invite = new TextInputBuilder()
    .setCustomId("invite_link")
    .setLabel("Davet linki")
    .setStyle(TextInputStyle.Short)
    .setMaxLength(200)
    .setPlaceholder("https://discord.gg/ornek")
    .setRequired(true);

  const memberCount = new TextInputBuilder()
    .setCustomId("member_count")
    .setLabel("Toplam uye sayisi")
    .setStyle(TextInputStyle.Short)
    .setMaxLength(10)
    .setRequired(true);

  const adText = new TextInputBuilder()
    .setCustomId("ad_text")
    .setLabel("Partnerlik tanitim metni")
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(1000)
    .setRequired(true);

  const reason = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("Neden partner olmak istiyorsun")
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(1000)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(serverName),
    new ActionRowBuilder().addComponents(invite),
    new ActionRowBuilder().addComponents(memberCount),
    new ActionRowBuilder().addComponents(adText),
    new ActionRowBuilder().addComponents(reason),
  );

  return modal;
}

function getPartnershipConfig(guildId) {
  return getGuildConfig(guildId).community.partnership;
}

function assertPartnershipReady(guildId) {
  const settings = getPartnershipConfig(guildId);
  if (!settings.enabled || !settings.categoryId || !settings.managerRoleId) {
    throw new Error("Partnerlik sistemi tam yapilandirilmamis.");
  }

  return settings;
}

function normalizeInviteLink(value) {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function getApplicantEntry(settings, userId) {
  return settings.applicants?.[userId] || null;
}

function setApplicantState(guildId, userId, patch) {
  const settings = getPartnershipConfig(guildId);
  const applicants = { ...(settings.applicants || {}) };
  applicants[userId] = {
    ...(applicants[userId] || {}),
    ...patch,
  };

  patchGuildConfig(guildId, {
    community: {
      partnership: {
        applicants,
      },
    },
  });
}

async function createPartnershipRequest(interaction) {
  const settings = assertPartnershipReady(interaction.guildId);
  const existing = interaction.guild.channels.cache.find(
    (channel) => channel.topic === `partnership-owner:${interaction.user.id}`,
  );

  if (existing) {
    throw new Error("Zaten acik bir partnerlik basvurun var.");
  }

  const applicantState = getApplicantEntry(settings, interaction.user.id);
  if (
    applicantState?.lastAppliedAt &&
    Date.now() - applicantState.lastAppliedAt < settings.cooldownMs
  ) {
    throw new Error("Yeni partnerlik basvurusu icin bekleme suresi dolmadi.");
  }

  if ((settings.blacklist || []).includes(interaction.user.id)) {
    throw new Error("Partnerlik sisteminde kara listedesin.");
  }

  const serverName = interaction.fields.getTextInputValue("server_name").trim();
  const inviteLink = normalizeInviteLink(interaction.fields.getTextInputValue("invite_link"));
  const memberCount = Number(interaction.fields.getTextInputValue("member_count").trim());
  const adText = interaction.fields.getTextInputValue("ad_text").trim();
  const reason = interaction.fields.getTextInputValue("reason").trim();

  if (!Number.isFinite(memberCount)) {
    throw new Error("Uye sayisi sayi olmali.");
  }

  if (memberCount < settings.minMemberCount) {
    throw new Error(`Minimum uye sayisi ${settings.minMemberCount} olmali.`);
  }

  const requestNumber = settings.counter + 1;
  const channel = await interaction.guild.channels.create({
    name: `partnerlik-${requestNumber}`,
    type: ChannelType.GuildText,
    parent: settings.categoryId,
    topic: `partnership-owner:${interaction.user.id}`,
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
        id: settings.managerRoleId,
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
      partnership: {
        ...settings,
        counter: requestNumber,
      },
    },
  });

  setApplicantState(interaction.guildId, interaction.user.id, {
    lastAppliedAt: Date.now(),
    status: "pending",
    channelId: channel.id,
    serverName,
    inviteLink,
    memberCount,
    adText,
    reason,
  });

  await channel.send({
    content: `<@&${settings.managerRoleId}> yeni bir partnerlik basvurusu var.`,
    embeds: [
      {
        color: COLORS.primary,
        title: "Partnerlik Basvurusu",
        description: `${interaction.user} partnerlik basvurusu gonderdi.`,
        fields: [
          { name: "Sunucu", value: serverName, inline: true },
          { name: "Uye Sayisi", value: String(memberCount), inline: true },
          { name: "Davet", value: inviteLink, inline: false },
          { name: "Tanitim", value: adText.slice(0, 1024), inline: false },
          { name: "Sebep", value: reason.slice(0, 1024), inline: false },
        ],
      },
    ],
    components: [partnershipReviewButtons()],
  });

  await sendLog(interaction.guild, {
    channelId: settings.logChannelId || undefined,
    color: COLORS.primary,
    title: "Partnerlik Basvurusu Acildi",
    description: `${interaction.user.tag} partnerlik basvurusu gonderdi.`,
    fields: [
      { name: "Kanal", value: `${channel}`, inline: true },
      { name: "Sunucu", value: serverName, inline: true },
    ],
  });

  return channel;
}

function getApplicationData(guildId, userId) {
  const settings = getPartnershipConfig(guildId);
  return getApplicantEntry(settings, userId);
}

function getApplicantIdFromChannel(channel) {
  if (!channel.topic?.startsWith("partnership-owner:")) {
    return null;
  }

  return channel.topic.split(":")[1];
}

async function archivePartnershipChannel(channel, archiveCategoryId) {
  if (archiveCategoryId) {
    await channel.setParent(archiveCategoryId).catch(() => null);
  }

  await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
    ViewChannel: false,
  }).catch(() => null);
}

async function approvePartnership(interaction) {
  const settings = assertPartnershipReady(interaction.guildId);
  const applicantId = getApplicantIdFromChannel(interaction.channel);
  if (!applicantId) {
    throw new Error("Bu kanal bir partnerlik basvuru kanali degil.");
  }

  const data = getApplicationData(interaction.guildId, applicantId);
  if (!data) {
    throw new Error("Basvuru verisi bulunamadi.");
  }

  if (settings.partnerChannelId) {
    const partnerChannel = await interaction.guild.channels.fetch(settings.partnerChannelId).catch(() => null);
    if (partnerChannel?.isTextBased()) {
      await partnerChannel.send({
        content: `Yeni partner sunucu: **${data.serverName}**\n${data.adText}\nDavet: ${data.inviteLink}`,
      }).catch(() => null);
    }
  }

  const partners = [...(settings.partners || [])];
  partners.push({
    userId: applicantId,
    approvedBy: interaction.user.id,
    approvedAt: Date.now(),
    serverName: data.serverName,
    inviteLink: data.inviteLink,
    memberCount: data.memberCount,
    adText: data.adText,
  });

  patchGuildConfig(interaction.guildId, {
    community: {
      partnership: {
        partners,
      },
    },
  });

  setApplicantState(interaction.guildId, applicantId, {
    status: "approved",
    approvedBy: interaction.user.id,
    approvedAt: Date.now(),
  });
  grantBadge(interaction.guildId, applicantId, "partner");

  await archivePartnershipChannel(interaction.channel, settings.archiveCategoryId);
  await interaction.channel.send({
    content: `Basvuru onaylandi. Basvuru sahibi: <@${applicantId}>`,
  }).catch(() => null);

  await sendLog(interaction.guild, {
    channelId: settings.logChannelId || undefined,
    color: COLORS.success,
    title: "Partnerlik Onaylandi",
    description: `${data.serverName} partner olarak onaylandi.`,
    fields: [
      { name: "Yetkili", value: `<@${interaction.user.id}>`, inline: true },
      { name: "Basvuru Sahibi", value: `<@${applicantId}>`, inline: true },
    ],
  });
}

async function rejectPartnership(interaction) {
  const settings = assertPartnershipReady(interaction.guildId);
  const applicantId = getApplicantIdFromChannel(interaction.channel);
  if (!applicantId) {
    throw new Error("Bu kanal bir partnerlik basvuru kanali degil.");
  }

  const data = getApplicationData(interaction.guildId, applicantId);
  if (!data) {
    throw new Error("Basvuru verisi bulunamadi.");
  }

  setApplicantState(interaction.guildId, applicantId, {
    status: "rejected",
    rejectedBy: interaction.user.id,
    rejectedAt: Date.now(),
  });

  await archivePartnershipChannel(interaction.channel, settings.archiveCategoryId);
  await interaction.channel.send({
    content: `Basvuru reddedildi. Basvuru sahibi: <@${applicantId}>`,
  }).catch(() => null);

  await sendLog(interaction.guild, {
    channelId: settings.logChannelId || undefined,
    color: COLORS.warning,
    title: "Partnerlik Reddedildi",
    description: `${data.serverName} basvurusu reddedildi.`,
    fields: [
      { name: "Yetkili", value: `<@${interaction.user.id}>`, inline: true },
      { name: "Basvuru Sahibi", value: `<@${applicantId}>`, inline: true },
    ],
  });
}

async function closePartnershipChannel(interaction) {
  const settings = assertPartnershipReady(interaction.guildId);
  await archivePartnershipChannel(interaction.channel, settings.archiveCategoryId);
  await interaction.channel.send({
    content: `Bu partnerlik kanali arsivlendi.`,
  }).catch(() => null);
}

module.exports = {
  partnershipButtons,
  buildPartnershipModal,
  createPartnershipRequest,
  approvePartnership,
  rejectPartnership,
  closePartnershipChannel,
};
