const { getGuildConfig } = require("../../data/store");
const { sendLog } = require("../logging/sendLog");
const { COLORS } = require("../../constants");
const { jailMember } = require("../moderation/jail");
const { evaluateEscalation } = require("../moderation/actions");
const { addRiskScore } = require("./risk");

function extractUrls(content) {
  return content.match(/https?:\/\/[^\s]+/gi) || [];
}

function isSuspicious(url, settings) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();

    if (settings.shortenerDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) {
      return { matched: hostname, reason: "Link kisaltici kullanimi" };
    }

    const suspicious = settings.suspiciousDomains.find(
      (domain) => hostname.includes(domain),
    );

    if (suspicious) {
      return { matched: hostname, reason: "Supheli domain eslesmesi" };
    }
  } catch {
    return { matched: "invalid", reason: "Gecersiz URL" };
  }

  return null;
}

async function handlePhishingProtection(message) {
  if (!message.guild || message.author.bot) {
    return false;
  }

  const guildConfig = getGuildConfig(message.guild.id);
  const settings = guildConfig.security.antiPhishing;
  if (!settings.enabled) {
    return false;
  }

  const urls = extractUrls(message.content);
  for (const url of urls) {
    const result = isSuspicious(url, settings);
    if (!result) {
      continue;
    }

    if (settings.deleteMessage) {
      await message.delete().catch(() => null);
    }

    const risk = await addRiskScore(message.guild, message.author.id, 40, "Supheli link paylasimi");

    if (settings.autoJail && guildConfig.security.jailRoleId && message.member?.manageable) {
      await jailMember(message.member, message.client.user, `Anti-phishing: ${result.reason}`).catch(() => null);
      await evaluateEscalation(message.member, message.client.user, "jail", result.reason).catch(() => null);
    }

    await sendLog(message.guild, {
      color: COLORS.danger,
      title: "Anti-Phishing Tetiklendi",
      description: `${message.author.tag} tarafindan supheli bir link paylasildi.`,
      fields: [
        { name: "Sebep", value: result.reason, inline: true },
        { name: "Host", value: result.matched, inline: true },
        { name: "Risk", value: String(risk.score), inline: true },
        { name: "Icerik", value: message.content.slice(0, 1024), inline: false },
      ],
    });

    return true;
  }

  return false;
}

module.exports = {
  handlePhishingProtection,
};
