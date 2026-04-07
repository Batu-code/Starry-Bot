const { getGuildConfig } = require("../../data/store");
const { sendLog } = require("../logging/sendLog");
const { COLORS } = require("../../constants");
const { addRiskScore } = require("./risk");
const { jailMember } = require("../moderation/jail");
const { evaluateEscalation } = require("../moderation/actions");

const STRONG_PATTERNS = [
  { regex: /(free|bedava|ucretsiz).{0,30}(nitro|steam|skin|gift)/i, score: 4, reason: "Sahte odul veya bedava urun vaadi" },
  { regex: /(hesab(in|ini|inizi)?|account).{0,30}(dogrula|verify|sifirla|reset|askiya)/i, score: 4, reason: "Hesap dogrulama veya sifirlama oltasi" },
  { regex: /(qr|karekod).{0,30}(tara|scan)/i, score: 4, reason: "QR kod ile kimlik avina zorlama" },
  { regex: /(seed phrase|mnemonic|metamask|wallet|cuzdan)/i, score: 5, reason: "Kripto cuzdan verisi talebi" },
  { regex: /(staff|yonetici|mod).{0,20}(dm|ozel mesaj)/i, score: 3, reason: "Sahte yetkili veya DM yonlendirmesi" },
];

const KEYWORD_GROUPS = [
  ["nitro", "gift", "claim", "redeem", "bedava", "free"],
  ["verify", "dogrula", "security", "guvenlik", "hesap", "account"],
  ["wallet", "metamask", "seed", "phrase", "mnemonic", "cuzdan"],
  ["scan", "tara", "qr", "karekod"],
];

function countKeywordGroups(content) {
  const lowered = content.toLowerCase();
  return KEYWORD_GROUPS.reduce((count, group) => {
    if (group.some((word) => lowered.includes(word))) {
      return count + 1;
    }
    return count;
  }, 0);
}

function analyzeScamContent(content) {
  if (!content?.trim()) {
    return { score: 0, reasons: [] };
  }

  let score = 0;
  const reasons = [];

  for (const pattern of STRONG_PATTERNS) {
    if (pattern.regex.test(content)) {
      score += pattern.score;
      reasons.push(pattern.reason);
    }
  }

  const keywordGroupCount = countKeywordGroups(content);
  if (keywordGroupCount >= 2) {
    score += keywordGroupCount;
    reasons.push("Birden fazla scam anahtar kelime grubu tespit edildi");
  }

  if (/@everyone|@here/i.test(content)) {
    score += 1;
    reasons.push("Toplu etiket kullanimi");
  }

  return { score, reasons };
}

async function handleScamShield(message) {
  if (!message.guild || message.author.bot) {
    return false;
  }

  const guildConfig = getGuildConfig(message.guild.id);
  const settings = guildConfig.security.scamShield;
  if (!settings.enabled) {
    return false;
  }

  const analysis = analyzeScamContent(message.content);
  if (analysis.score < settings.minScore) {
    return false;
  }

  if (settings.deleteMessage) {
    await message.delete().catch(() => null);
  }

  const risk = await addRiskScore(message.guild, message.author.id, Math.min(analysis.score * 10, 80), "Scam metin benzerligi");

  if (
    settings.autoJail &&
    analysis.score >= settings.autoJailScore &&
    guildConfig.security.jailRoleId &&
    message.member?.manageable
  ) {
    await jailMember(message.member, message.client.user, "Scam Shield: supheli dolandiricilik metni").catch(() => null);
    await evaluateEscalation(message.member, message.client.user, "jail", "Scam Shield").catch(() => null);
  }

  await sendLog(message.guild, {
    color: COLORS.danger,
    title: "Scam Shield Tetiklendi",
    description: `${message.author.tag} tarafindan supheli dolandiricilik metni algilandi.`,
    fields: [
      { name: "Skor", value: String(analysis.score), inline: true },
      { name: "Risk", value: String(risk.score), inline: true },
      { name: "Sebep", value: analysis.reasons.slice(0, 3).join(", ") || "Supheli icerik", inline: false },
      { name: "Icerik", value: message.content.slice(0, 1024), inline: false },
    ],
  });

  return true;
}

module.exports = {
  analyzeScamContent,
  handleScamShield,
};
