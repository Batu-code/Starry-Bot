const { getGuildConfig, patchGuildConfig } = require("../../data/store");

const SEVERITY_WEIGHTS = {
  warn: 1,
  timeout: 2,
  jail: 3,
  kick: 4,
  ban: 6,
  antinuke: 12,
};

function listIncidents(guildId) {
  return getGuildConfig(guildId).security.moderatorAudit.incidents || [];
}

function recordModeratorIncident(guildId, payload) {
  const config = getGuildConfig(guildId);
  if (!config.security.moderatorAudit.enabled) {
    return null;
  }

  const incidents = [
    ...(config.security.moderatorAudit.incidents || []),
    {
      id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: Date.now(),
      severity: SEVERITY_WEIGHTS[payload.type] || 1,
      ...payload,
    },
  ].slice(-(config.security.moderatorAudit.keepLast || 250));

  patchGuildConfig(guildId, {
    security: {
      moderatorAudit: {
        incidents,
      },
    },
  });

  return incidents[incidents.length - 1];
}

function buildModeratorAudit(guildId, moderatorId = null) {
  const incidents = listIncidents(guildId).filter((entry) =>
    moderatorId ? entry.moderatorId === moderatorId : true,
  );

  const summary = {
    total: incidents.length,
    totalSeverity: 0,
    byType: {},
    byModerator: {},
    lastIncidentAt: 0,
    incidents,
  };

  for (const entry of incidents) {
    summary.totalSeverity += entry.severity || 0;
    summary.byType[entry.type] = (summary.byType[entry.type] || 0) + 1;
    summary.lastIncidentAt = Math.max(summary.lastIncidentAt, entry.createdAt || 0);

    if (!entry.moderatorId) {
      continue;
    }

    if (!summary.byModerator[entry.moderatorId]) {
      summary.byModerator[entry.moderatorId] = {
        total: 0,
        severity: 0,
        byType: {},
        lastActionAt: 0,
      };
    }

    summary.byModerator[entry.moderatorId].total += 1;
    summary.byModerator[entry.moderatorId].severity += entry.severity || 0;
    summary.byModerator[entry.moderatorId].byType[entry.type] =
      (summary.byModerator[entry.moderatorId].byType[entry.type] || 0) + 1;
    summary.byModerator[entry.moderatorId].lastActionAt = Math.max(
      summary.byModerator[entry.moderatorId].lastActionAt,
      entry.createdAt || 0,
    );
  }

  return summary;
}

function getModeratorTrustScore(guildId, moderatorId) {
  const audit = buildModeratorAudit(guildId, moderatorId);
  const score = Math.max(0, 100 - audit.totalSeverity * 2);
  return {
    score,
    level: score >= 85 ? "iyi" : score >= 60 ? "izlenmeli" : "riskli",
    audit,
  };
}

module.exports = {
  listIncidents,
  recordModeratorIncident,
  buildModeratorAudit,
  getModeratorTrustScore,
};
