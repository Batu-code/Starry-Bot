const { getGuildConfig, patchGuildConfig } = require("../../data/store");
const { sendLog } = require("../logging/sendLog");
const { COLORS } = require("../../constants");
const { completeTask } = require("../progression/profiles");
const { evaluateAutoStaff } = require("../community/staffRecruitment");

function getInviteDetailEntry(config, userId) {
  return config.stats.inviteDetails?.[userId] || {
    regular: 0,
    fake: 0,
    leaves: 0,
    bonusClaimed: [],
  };
}

async function cacheGuildInvites(guild) {
  const invites = await guild.invites.fetch().catch(() => null);
  if (!invites) {
    return;
  }

  const inviteCache = {};
  for (const invite of invites.values()) {
    inviteCache[invite.code] = {
      uses: invite.uses || 0,
      inviterId: invite.inviterId || invite.inviter?.id || null,
    };
  }

  patchGuildConfig(guild.id, {
    state: {
      inviteCache,
    },
  });
}

async function detectInviteUse(member) {
  const guildConfig = getGuildConfig(member.guild.id);
  const before = guildConfig.state.inviteCache || {};
  const invites = await member.guild.invites.fetch().catch(() => null);
  if (!invites) {
    return null;
  }

  let usedInvite = null;
  const nextCache = {};

  for (const invite of invites.values()) {
    nextCache[invite.code] = {
      uses: invite.uses || 0,
      inviterId: invite.inviterId || invite.inviter?.id || null,
    };

    const previousUses = before[invite.code]?.uses || 0;
    if ((invite.uses || 0) > previousUses) {
      usedInvite = invite;
    }
  }

  patchGuildConfig(member.guild.id, {
    state: {
      inviteCache: nextCache,
    },
  });

  if (usedInvite?.inviterId) {
    const settings = guildConfig.community.invites;
    const stats = guildConfig.stats.invites || {};
    const inviteDetails = {
      ...(guildConfig.stats.inviteDetails || {}),
    };
    const detail = getInviteDetailEntry(guildConfig, usedInvite.inviterId);
    const accountAgeMs = Date.now() - member.user.createdTimestamp;
    const isFake = accountAgeMs < settings.fakeAccountAgeMs;

    if (isFake) {
      detail.fake += 1;
    } else {
      stats[usedInvite.inviterId] = (stats[usedInvite.inviterId] || 0) + 1;
      detail.regular = stats[usedInvite.inviterId];
    }

    for (const milestone of settings.bonusMilestones || []) {
      if (!isFake && detail.regular >= milestone && !detail.bonusClaimed.includes(milestone)) {
        detail.bonusClaimed.push(milestone);
      }
    }

    inviteDetails[usedInvite.inviterId] = detail;

    patchGuildConfig(member.guild.id, {
      stats: {
        invites: stats,
        inviteDetails,
      },
      state: {
        inviteJoins: {
          ...(guildConfig.state.inviteJoins || {}),
          [member.id]: {
            inviterId: usedInvite.inviterId,
            isFake,
            joinedAt: Date.now(),
          },
        },
      },
    });

    if (!isFake) {
      completeTask(member.guild.id, usedInvite.inviterId, "invite_once");
    }

    const inviterMember = await member.guild.members.fetch(usedInvite.inviterId).catch(() => null);
    if (inviterMember) {
      await evaluateAutoStaff(inviterMember, "Davet puani ile otomatik yetkili alim").catch(() => null);
    }

    await sendLog(member.guild, {
      color: COLORS.primary,
      title: "Davet Takibi",
      description: `${member.user.tag} sunucuya bir davet ile katildi.`,
      fields: [
        { name: "Davet Eden", value: `<@${usedInvite.inviterId}>`, inline: true },
        { name: "Kod", value: usedInvite.code, inline: true },
        { name: "Durum", value: accountAgeMs < settings.fakeAccountAgeMs ? "Fake sayildi" : "Gecerli", inline: true },
        { name: "Toplam", value: String(stats[usedInvite.inviterId] || 0), inline: true },
      ],
    });
  }

  return usedInvite;
}

async function handleTrackedInviteLeave(member) {
  const guildConfig = getGuildConfig(member.guild.id);
  const joined = guildConfig.state.inviteJoins?.[member.id];
  if (!joined?.inviterId) {
    return null;
  }

  const nextInviteJoins = {
    ...(guildConfig.state.inviteJoins || {}),
  };
  delete nextInviteJoins[member.id];

  const inviteDetails = {
    ...(guildConfig.stats.inviteDetails || {}),
  };
  const detail = getInviteDetailEntry(guildConfig, joined.inviterId);
  detail.leaves += 1;
  inviteDetails[joined.inviterId] = detail;

  const patch = {
    state: {
      inviteJoins: nextInviteJoins,
    },
    stats: {
      inviteDetails,
    },
  };

  if (!joined.isFake && guildConfig.community.invites.decrementOnLeave) {
    const nextInvites = {
      ...(guildConfig.stats.invites || {}),
    };
    nextInvites[joined.inviterId] = Math.max(0, (nextInvites[joined.inviterId] || 0) - 1);
    patch.stats.invites = nextInvites;
  }

  patchGuildConfig(member.guild.id, patch);

  await sendLog(member.guild, {
    color: COLORS.muted,
    title: "Davet Cikis Takibi",
    description: `${member.user.tag} ayrildi.`,
    fields: [{ name: "Davet Eden", value: `<@${joined.inviterId}>`, inline: true }],
  });

  return joined;
}

module.exports = {
  cacheGuildInvites,
  detectInviteUse,
  handleTrackedInviteLeave,
};
