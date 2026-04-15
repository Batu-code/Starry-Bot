const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField,
} = require("discord.js");
const { getGuildConfig, patchGuildConfig } = require("../../data/store");
const { sendLog } = require("../logging/sendLog");
const { COLORS } = require("../../constants");
const { recordStaffAction } = require("./staffStats");

function getSettings(guildId) {
  return getGuildConfig(guildId).community.feedback;
}

function assertFeedbackReady(guildId, kind) {
  const settings = getSettings(guildId);
  const neededChannelId = kind === "suggestion"
    ? settings.suggestionChannelId
    : settings.complaintChannelId;
  if (!settings.enabled || !neededChannelId) {
    throw new Error("Oneri/sikayet sistemi tam yapilandirilmamis.");
  }
  return settings;
}

function panelButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("feedback_open:suggestion")
        .setLabel("Oneri Birak")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("feedback_open:complaint")
        .setLabel("Sikayet Gonder")
        .setStyle(ButtonStyle.Danger),
    ),
  ];
}

function buildFeedbackModal(kind) {
  const modal = new ModalBuilder()
    .setCustomId(`feedback_modal:${kind}`)
    .setTitle(kind === "suggestion" ? "Oneri Formu" : "Sikayet Formu");

  const title = new TextInputBuilder()
    .setCustomId("feedback_title")
    .setLabel("Baslik")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

  const body = new TextInputBuilder()
    .setCustomId("feedback_body")
    .setLabel("Detay")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(1000);

  modal.addComponents(
    new ActionRowBuilder().addComponents(title),
    new ActionRowBuilder().addComponents(body),
  );

  return modal;
}

function updateItems(guildId, items) {
  patchGuildConfig(guildId, {
    community: {
      feedback: {
        items,
      },
    },
  });
}

function setItem(guildId, id, item) {
  const settings = getSettings(guildId);
  updateItems(guildId, {
    ...(settings.items || {}),
    [id]: item,
  });
}

function getItem(guildId, id) {
  return getSettings(guildId).items?.[id] || null;
}

function buildItemButtons(item) {
  if (item.kind === "suggestion") {
    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`feedback_vote:${item.id}:up`)
          .setLabel(`Destekle (${item.upvotes.length})`)
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`feedback_vote:${item.id}:down`)
          .setLabel(`Karsi (${item.downvotes.length})`)
          .setStyle(ButtonStyle.Secondary),
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`feedback_review:${item.id}:accepted`)
          .setLabel("Kabul Et")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`feedback_review:${item.id}:rejected`)
          .setLabel("Reddet")
          .setStyle(ButtonStyle.Danger),
      ),
    ];
  }

  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`feedback_review:${item.id}:accepted`)
        .setLabel("Isleme Al")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`feedback_review:${item.id}:rejected`)
        .setLabel("Kapandi")
        .setStyle(ButtonStyle.Secondary),
    ),
  ];
}

async function submitFeedback(interaction, kind) {
  const settings = assertFeedbackReady(interaction.guildId, kind);
  const channelId = kind === "suggestion" ? settings.suggestionChannelId : settings.complaintChannelId;
  const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased()) {
    throw new Error("Bildirim kanali kullanilamiyor.");
  }

  const id = `feedback-${Date.now()}`;
  const item = {
    id,
    kind,
    title: interaction.fields.getTextInputValue("feedback_title").trim(),
    body: interaction.fields.getTextInputValue("feedback_body").trim(),
    authorId: interaction.user.id,
    status: "open",
    upvotes: [],
    downvotes: [],
    createdAt: Date.now(),
    messageId: null,
  };

  const sent = await channel.send({
    embeds: [
      {
        color: kind === "suggestion" ? COLORS.success : COLORS.warning,
        title: kind === "suggestion" ? "Yeni Oneri" : "Yeni Sikayet",
        description: item.body,
        fields: [
          { name: "Baslik", value: item.title, inline: false },
          { name: "Gonderen", value: `<@${interaction.user.id}>`, inline: true },
          { name: "Durum", value: "Bekliyor", inline: true },
        ],
      },
    ],
    components: buildItemButtons(item),
  }).catch(() => null);

  item.messageId = sent?.id || null;
  setItem(interaction.guildId, id, item);

  await sendLog(interaction.guild, {
    channelId: settings.logChannelId || undefined,
    color: kind === "suggestion" ? COLORS.success : COLORS.warning,
    title: kind === "suggestion" ? "Oneri Geldi" : "Sikayet Geldi",
    description: `${interaction.user.tag} yeni bir ${kind === "suggestion" ? "oneri" : "sikayet"} gonderdi.`,
  });
}

function isReviewer(interaction) {
  const settings = getSettings(interaction.guildId);
  if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
    return true;
  }

  return Boolean(settings.reviewRoleId && interaction.member.roles.cache.has(settings.reviewRoleId));
}

async function voteFeedback(interaction, id, direction) {
  const item = getItem(interaction.guildId, id);
  if (!item || item.kind !== "suggestion") {
    throw new Error("Oneri kaydi bulunamadi.");
  }

  const userId = interaction.user.id;
  const upvotes = new Set(item.upvotes || []);
  const downvotes = new Set(item.downvotes || []);

  upvotes.delete(userId);
  downvotes.delete(userId);
  if (direction === "up") {
    upvotes.add(userId);
  } else {
    downvotes.add(userId);
  }

  const next = {
    ...item,
    upvotes: [...upvotes],
    downvotes: [...downvotes],
  };
  setItem(interaction.guildId, id, next);

  await interaction.update({
    embeds: [
      {
        color: COLORS.success,
        title: "Yeni Oneri",
        description: next.body,
        fields: [
          { name: "Baslik", value: next.title, inline: false },
          { name: "Gonderen", value: `<@${next.authorId}>`, inline: true },
          { name: "Durum", value: next.status === "open" ? "Bekliyor" : next.status, inline: true },
        ],
      },
    ],
    components: buildItemButtons(next),
  }).catch(() => null);
}

async function reviewFeedback(interaction, id, status) {
  const item = getItem(interaction.guildId, id);
  if (!item) {
    throw new Error("Kayit bulunamadi.");
  }
  const settings = getSettings(interaction.guildId);

  const next = {
    ...item,
    status,
    reviewedBy: interaction.user.id,
    reviewedAt: Date.now(),
  };
  setItem(interaction.guildId, id, next);

  recordStaffAction(
    interaction.guildId,
    interaction.user.id,
    item.kind === "suggestion" ? "suggestionReview" : "complaintReview",
    { feedbackId: id, status },
  );

  await sendLog(interaction.guild, {
    channelId: settings.logChannelId || undefined,
    color: status === "accepted" ? COLORS.success : COLORS.warning,
    title: item.kind === "suggestion" ? "Oneri Degerlendirildi" : "Sikayet Degerlendirildi",
    description: `${item.title} kaydi guncellendi.`,
    fields: [{ name: "Durum", value: status, inline: true }],
  });

  await interaction.update({
    embeds: [
      {
        color: status === "accepted" ? COLORS.success : COLORS.warning,
        title: item.kind === "suggestion" ? "Oneri" : "Sikayet",
        description: next.body,
        fields: [
          { name: "Baslik", value: next.title, inline: false },
          { name: "Gonderen", value: `<@${next.authorId}>`, inline: true },
          { name: "Durum", value: status === "accepted" ? "Kabul edildi" : "Kapatildi", inline: true },
        ],
      },
    ],
    components: buildItemButtons(next),
  }).catch(() => null);
}

module.exports = {
  panelButtons,
  buildFeedbackModal,
  submitFeedback,
  voteFeedback,
  reviewFeedback,
  isReviewer,
};
