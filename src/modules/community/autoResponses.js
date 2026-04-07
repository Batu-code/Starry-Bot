const { getGuildConfig } = require("../../data/store");
const { DEFAULT_GUILD_CONFIG } = require("../../constants");

function normalizeText(value) {
  return String(value || "")
    .normalize("NFC")
    .trim()
    .toLocaleLowerCase("tr-TR");
}

function getResponseItems(guildId) {
  const saved = getGuildConfig(guildId).community.autoResponses?.items || [];
  const defaults = DEFAULT_GUILD_CONFIG.community.autoResponses?.items || [];
  const merged = new Map();

  for (const item of defaults) {
    merged.set(normalizeText(item.trigger), item);
  }

  for (const item of saved) {
    merged.set(normalizeText(item.trigger), item);
  }

  return [...merged.values()];
}

async function handleAutoResponses(message) {
  if (!message.guild || message.author.bot) {
    return false;
  }

  const config = getGuildConfig(message.guild.id).community.autoResponses;
  if (!config?.enabled) {
    return false;
  }

  const content = normalizeText(message.content);
  const match = getResponseItems(message.guild.id).find((item) => {
    const trigger = normalizeText(item.trigger);
    if (!trigger) {
      return false;
    }

    if (item.exact === false) {
      return content.includes(trigger);
    }

    return content === trigger;
  });

  if (!match?.response) {
    return false;
  }

  await message.channel.send({
    content: match.response,
  }).catch(() => null);

  return true;
}

module.exports = {
  handleAutoResponses,
};
