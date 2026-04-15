const {
  updateVoiceStats,
  markVoiceSessionStart,
  markVoiceSessionEnd,
} = require("./ranking");
const { evaluateAutoStaff } = require("../community/staffRecruitment");

function buildSessionKey(guildId, userId) {
  return `${guildId}:${userId}`;
}

function snapshotVoiceState(state) {
  return {
    muted: Boolean(state.selfMute || state.serverMute),
    deafened: Boolean(state.selfDeaf || state.serverDeaf),
    streaming: Boolean(state.streaming || state.selfVideo),
  };
}

async function flushVoiceState(client, state, now = Date.now()) {
  if (!state.guild || !state.member || state.member.user.bot) {
    return;
  }

  const userId = state.member.id;
  const key = buildSessionKey(state.guild.id, userId);
  const session = client.runtime.voiceSessions.get(key);
  if (!session) {
    return;
  }

  const elapsedSeconds = Math.floor((now - session.lastTrackedAt) / 1000);
  if (elapsedSeconds > 0) {
    const result = updateVoiceStats(state.guild.id, userId, elapsedSeconds, session.state);
    if (!session.state.deafened) {
      await evaluateAutoStaff(state.member, "Ses aktivitesi ile otomatik yetkili alim").catch(() => null);
    }

    session.lastKnownLevel = result.stats.level;
  }

  session.lastTrackedAt = now;
  client.runtime.voiceSessions.set(key, session);
}

async function handleVoiceTracking(client, oldState, newState) {
  const activeState = newState.channelId ? newState : oldState;
  if (!activeState.guild || !activeState.member || activeState.member.user.bot) {
    return;
  }

  const userId = activeState.member.id;
  const key = buildSessionKey(activeState.guild.id, userId);
  const wasInVoice = Boolean(oldState.channelId);
  const isInVoice = Boolean(newState.channelId);
  const now = Date.now();

  if (!wasInVoice && isInVoice) {
    client.runtime.voiceSessions.set(key, {
      lastTrackedAt: now,
      state: snapshotVoiceState(newState),
      lastKnownLevel: 0,
    });
    markVoiceSessionStart(newState.guild.id, userId);
    return;
  }

  if (wasInVoice && isInVoice) {
    await flushVoiceState(client, newState, now);
    client.runtime.voiceSessions.set(key, {
      ...(client.runtime.voiceSessions.get(key) || {}),
      lastTrackedAt: now,
      state: snapshotVoiceState(newState),
    });
    return;
  }

  if (wasInVoice && !isInVoice) {
    await flushVoiceState(client, oldState, now);
    client.runtime.voiceSessions.delete(key);
    markVoiceSessionEnd(oldState.guild.id, userId);
  }
}

module.exports = {
  handleVoiceTracking,
};
