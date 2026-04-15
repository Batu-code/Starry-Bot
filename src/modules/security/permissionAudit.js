const { PermissionFlagsBits } = require("discord.js");
const { getGuildConfig } = require("../../data/store");
const { formatPermission, listMissingPermissions } = require("../../utils/permissions");

function channelRequirement(label, channelId, permissions, severity = "warning") {
  return { type: "channel", label, channelId, permissions, severity };
}

function guildRequirement(label, permissions, severity = "critical") {
  return { type: "guild", label, permissions, severity };
}

function collectRequirements(guildId) {
  const config = getGuildConfig(guildId);
  const requirements = [
    guildRequirement("Temel moderasyon", [
      PermissionFlagsBits.ViewAuditLog,
      PermissionFlagsBits.ManageRoles,
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ModerateMembers,
    ]),
  ];

  if (config.security.logChannelId) {
    requirements.push(channelRequirement("Guvenlik Log", config.security.logChannelId, [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.EmbedLinks,
    ]));
  }

  const textTargets = [
    ["Topluluk Log", config.community.logChannelId],
    ["Hosgeldin", config.community.welcomeChannelId],
    ["Cikis", config.community.leaveChannelId],
    ["Boost", config.community.boost.channelId],
    ["Ticket Panel", config.community.ticket.panelChannelId],
    ["Ticket Transcript", config.community.ticket.transcriptChannelId],
    ["Basvuru Panel", config.community.applications.panelChannelId],
    ["Oneri Panel", config.community.feedback.panelChannelId],
    ["Oneriler", config.community.feedback.suggestionChannelId],
    ["Sikayetler", config.community.feedback.complaintChannelId],
    ["Haftalik Rapor", config.automation.weeklyReports.channelId],
  ];

  for (const [label, channelId] of textTargets) {
    if (!channelId) {
      continue;
    }
    requirements.push(channelRequirement(label, channelId, [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.EmbedLinks,
    ]));
  }

  if (config.community.ticket.transcriptChannelId) {
    requirements.push(channelRequirement("Ticket Transcript Dosya", config.community.ticket.transcriptChannelId, [
      PermissionFlagsBits.AttachFiles,
    ]));
  }

  const categoryTargets = [
    ["Ticket Kategorisi", config.community.ticket.categoryId],
    ["Basvuru Kategorisi", config.community.applications.categoryId],
    ["Temp Voice Kategorisi", config.community.tempVoice.categoryId],
  ];

  for (const [label, channelId] of categoryTargets) {
    if (!channelId) {
      continue;
    }
    requirements.push(channelRequirement(label, channelId, [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.ManageChannels,
    ], "critical"));
  }

  if (config.community.autoRoleIds.length || config.community.boost.roleId || config.community.staffRecruitment.enabled) {
    requirements.push(guildRequirement("Rol otomasyonu", [
      PermissionFlagsBits.ManageRoles,
    ]));
  }

  if (config.security.antiSpam.enabled || config.security.autoMute.enabled) {
    requirements.push(guildRequirement("Oto mute / timeout", [
      PermissionFlagsBits.ModerateMembers,
    ]));
  }

  if ((config.moderation.cases || []).length > 0 || config.moderation.escalation.enabled) {
    requirements.push(guildRequirement("Kick / Ban", [
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.BanMembers,
    ], "warning"));
  }

  return requirements;
}

async function auditBotPermissions(guild) {
  const me = guild.members.me || await guild.members.fetchMe().catch(() => null);
  if (!me) {
    return {
      ok: false,
      issues: [{ severity: "critical", label: "Bot uye bilgisi alinamadi", missing: [] }],
      summary: { critical: 1, warning: 0 },
    };
  }

  const issues = [];
  const summary = { critical: 0, warning: 0 };

  for (const requirement of collectRequirements(guild.id)) {
    let missing = [];

    if (requirement.type === "guild") {
      missing = listMissingPermissions(me.permissions, requirement.permissions);
    } else {
      const channel = await guild.channels.fetch(requirement.channelId).catch(() => null);
      if (!channel) {
        missing = requirement.permissions;
      } else {
        missing = listMissingPermissions(channel.permissionsFor(me), requirement.permissions);
      }
    }

    if (!missing.length) {
      continue;
    }

    issues.push({
      severity: requirement.severity,
      label: requirement.label,
      missing,
      missingText: missing.map(formatPermission).join(", "),
    });
    summary[requirement.severity] += 1;
  }

  return {
    ok: issues.length === 0,
    issues,
    summary,
  };
}

module.exports = {
  auditBotPermissions,
};
