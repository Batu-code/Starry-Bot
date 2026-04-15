const { getGuildConfig } = require("../../data/store");
const { getCombinedRankProfile } = require("../progression/ranking");
const { sendLog } = require("../logging/sendLog");
const { COLORS } = require("../../constants");

function getRecruitmentConfig(guildId) {
  return getGuildConfig(guildId).community.staffRecruitment;
}

function meetsRecruitmentRequirements(guildId, userId) {
  const config = getRecruitmentConfig(guildId);
  const profile = getCombinedRankProfile(guildId, userId);

  return {
    eligible:
      profile.message.level >= config.minMessageLevel &&
      profile.voice.activeSeconds >= config.minVoiceHours * 60 * 60 &&
      profile.invites >= config.minInviteCount &&
      profile.partner.score >= config.minPartnerScore,
    profile,
  };
}

async function evaluateAutoStaff(member, reason = "Otomatik yetkili alim") {
  if (!member || member.user?.bot) {
    return false;
  }

  const config = getRecruitmentConfig(member.guild.id);
  if (!config.enabled || !config.roleId) {
    return false;
  }

  const role = member.guild.roles.cache.get(config.roleId);
  if (!role || member.roles.cache.has(role.id)) {
    return false;
  }

  const { eligible, profile } = meetsRecruitmentRequirements(member.guild.id, member.id);
  if (!eligible) {
    return false;
  }

  await member.roles.add(role, reason).catch(() => null);
  await sendLog(member.guild, {
    channelId: config.logChannelId || undefined,
    color: COLORS.success,
    title: "Oto Yetkili Alim",
    description: `${member.user.tag} otomatik olarak yetkili rolune alindi.`,
    fields: [
      { name: "Chat Seviye", value: String(profile.message.level), inline: true },
      { name: "Ses Saati", value: (profile.voice.activeSeconds / 3600).toFixed(1), inline: true },
      { name: "Davet", value: String(profile.invites), inline: true },
      { name: "Partner Puan", value: String(profile.partner.score), inline: true },
    ],
  });
  return true;
}

module.exports = {
  getRecruitmentConfig,
  meetsRecruitmentRequirements,
  evaluateAutoStaff,
};
