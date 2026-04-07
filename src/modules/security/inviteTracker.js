const { getGuildConfig, patchGuildConfig } = require("../../data/store");
const { sendLog } = require("../logging/sendLog");
const { COLORS } = require("../../constants");
const { addBalance } = require("../economy/system");
const { completeTask } = require("../progression/profiles");

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
    const stats = guildConfig.stats.invites || {};
    stats[usedInvite.inviterId] = (stats[usedInvite.inviterId] || 0) + 1;
    patchGuildConfig(member.guild.id, {
      stats: {
        invites: stats,
      },
    });
    addBalance(member.guild.id, usedInvite.inviterId, 75);
    completeTask(member.guild.id, usedInvite.inviterId, "invite_once");

    await sendLog(member.guild, {
      color: COLORS.primary,
      title: "Davet Takibi",
      description: `${member.user.tag} sunucuya bir davet ile katildi.`,
      fields: [
        { name: "Davet Eden", value: `<@${usedInvite.inviterId}>`, inline: true },
        { name: "Kod", value: usedInvite.code, inline: true },
        { name: "Toplam", value: String(stats[usedInvite.inviterId]), inline: true },
      ],
    });
  }

  return usedInvite;
}

module.exports = {
  cacheGuildInvites,
  detectInviteUse,
};
