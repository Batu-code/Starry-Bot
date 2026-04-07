const { getGuildConfig } = require("../../data/store");
const { addRiskScore } = require("./risk");
const { sendLog } = require("../logging/sendLog");
const { COLORS } = require("../../constants");

async function handleAltProtection(member) {
  const config = getGuildConfig(member.guild.id);
  const settings = config.security.antiAlt;
  if (!settings.enabled) {
    return { triggered: false };
  }

  const accountAge = Date.now() - member.user.createdTimestamp;
  if (accountAge >= settings.minAccountAgeMs) {
    return { triggered: false };
  }

  if (settings.autoQuarantine && config.security.quarantineRoleId) {
    const role = member.guild.roles.cache.get(config.security.quarantineRoleId);
    if (role) {
      await member.roles.add(role, "Anti-alt quarantine").catch(() => null);
    }
  }

  const risk = await addRiskScore(member.guild, member.id, 25, "Yeni hesap tespit edildi");
  await sendLog(member.guild, {
    color: COLORS.warning,
    title: "Anti-Alt Tetiklendi",
    description: `${member.user.tag} yeni hesap olarak isaretlendi.`,
    fields: [
      { name: "Hesap Yasi", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      { name: "Risk", value: String(risk.score), inline: true },
    ],
  });

  return { triggered: true, risk };
}

module.exports = {
  handleAltProtection,
};

