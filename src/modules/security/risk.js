const { getGuildConfig, patchGuildConfig } = require("../../data/store");
const { sendLog } = require("../logging/sendLog");
const { COLORS } = require("../../constants");

function getRiskEntry(guildId, userId) {
  const config = getGuildConfig(guildId);
  return config.security.risk.scores[userId] || {
    score: 0,
    history: [],
  };
}

function setRiskEntry(guildId, userId, entry) {
  const config = getGuildConfig(guildId);
  const scores = {
    ...config.security.risk.scores,
    [userId]: entry,
  };

  patchGuildConfig(guildId, {
    security: {
      risk: {
        scores,
      },
    },
  });
}

async function addRiskScore(guild, userId, amount, reason) {
  const config = getGuildConfig(guild.id);
  if (!config.security.risk.enabled) {
    return { score: 0, action: null };
  }

  const current = getRiskEntry(guild.id, userId);
  const next = {
    score: current.score + amount,
    history: [
      ...current.history,
      {
        amount,
        reason,
        createdAt: Date.now(),
      },
    ].slice(-20),
  };

  setRiskEntry(guild.id, userId, next);

  let action = null;
  if (next.score >= config.security.risk.banThreshold) {
    action = "ban";
  } else if (next.score >= config.security.risk.jailThreshold) {
    action = "jail";
  } else if (next.score >= config.security.risk.warnThreshold) {
    action = "warn";
  }

  await sendLog(guild, {
    color: COLORS.warning,
    title: "Risk Puani Guncellendi",
    description: `<@${userId}> icin risk puani guncellendi.`,
    fields: [
      { name: "Puan", value: String(next.score), inline: true },
      { name: "Sebep", value: reason, inline: true },
      { name: "Aksiyon", value: action || "Yok", inline: true },
    ],
  });

  return { score: next.score, action };
}

module.exports = {
  getRiskEntry,
  addRiskScore,
};

