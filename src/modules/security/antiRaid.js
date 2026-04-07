const { getGuildConfig, patchGuildConfig } = require("../../data/store");
const { sendLog } = require("../logging/sendLog");
const { COLORS } = require("../../constants");
const { now, formatDuration } = require("../../utils/time");
const { setLockdown } = require("./lockdown");

function getTracker(client, guildId) {
  if (!client.runtime.antiRaid.has(guildId)) {
    client.runtime.antiRaid.set(guildId, []);
  }

  return client.runtime.antiRaid.get(guildId);
}

function isRaidMode(guildId) {
  const guildConfig = getGuildConfig(guildId);
  return Boolean(guildConfig.state.raidModeUntil && guildConfig.state.raidModeUntil > now());
}

async function activateRaidMode(guild, reason) {
  const guildConfig = getGuildConfig(guild.id);
  const until = now() + guildConfig.security.antiRaid.lockdownDurationMs;
  await setLockdown(guild, true, `Anti-raid: ${reason}`);
  patchGuildConfig(guild.id, {
    state: {
      raidModeUntil: until,
    },
  });

  await sendLog(guild, {
    color: COLORS.danger,
    title: "Anti-Raid Tetiklendi",
    description: `Raid modu aktif edildi. Sebep: ${reason}`,
    fields: [{ name: "Sure", value: formatDuration(guildConfig.security.antiRaid.lockdownDurationMs) }],
  });

  return until;
}

async function handleMemberJoin(client, member) {
  const guildConfig = getGuildConfig(member.guild.id);
  const antiRaid = guildConfig.security.antiRaid;

  if (!antiRaid.enabled) {
    return { raidMode: false, activated: false };
  }

  const tracker = getTracker(client, member.guild.id);
  const current = now();
  tracker.push(current);

  while (tracker.length && current - tracker[0] > antiRaid.windowMs) {
    tracker.shift();
  }

  let activated = false;
  if (tracker.length >= antiRaid.joinLimit && !isRaidMode(member.guild.id)) {
    await activateRaidMode(member.guild, `Kisa surede ${tracker.length} giris algilandi.`);
    activated = true;
  }

  const raidMode = isRaidMode(member.guild.id);

  if (raidMode && antiRaid.autoQuarantine && guildConfig.security.quarantineRoleId) {
    const role = member.guild.roles.cache.get(guildConfig.security.quarantineRoleId);
    if (role) {
      await member.roles.add(role, "Raid mode quarantine").catch(() => null);
    }
  }

  return { raidMode, activated };
}

async function releaseExpiredRaidModes(client) {
  for (const guild of client.guilds.cache.values()) {
    const guildConfig = getGuildConfig(guild.id);
    if (
      guildConfig.security.lockdown.active &&
      guildConfig.state.raidModeUntil &&
      guildConfig.state.raidModeUntil <= now()
    ) {
      await setLockdown(guild, false, "Anti-raid suresi doldu");
      patchGuildConfig(guild.id, {
        state: {
          raidModeUntil: null,
        },
      });
    }
  }
}

module.exports = {
  handleMemberJoin,
  isRaidMode,
  activateRaidMode,
  releaseExpiredRaidModes,
};
