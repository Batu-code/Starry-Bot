const { handleMessageSecurity } = require("../modules/security/antiSpam");
const { handlePhishingProtection } = require("../modules/security/antiPhishing");
const { handleScamShield } = require("../modules/security/scamShield");
const { handleAutoResponses } = require("../modules/community/autoResponses");
const { handleLeveling } = require("../modules/community/leveling");
const { getGuildConfig } = require("../data/store");
const { generateSupportAnswer, isAiAvailable } = require("../modules/ai/openai");

module.exports = {
  name: "messageCreate",
  async execute(client, message) {
    if (!message.guild || message.author.bot) {
      return;
    }

    const scamBlocked = await handleScamShield(message);
    if (scamBlocked) {
      return;
    }

    const phishingBlocked = await handlePhishingProtection(message);
    if (phishingBlocked) {
      return;
    }

    const autoResponseSent = await handleAutoResponses(message);
    if (autoResponseSent) {
      return;
    }

    const guildConfig = getGuildConfig(message.guild.id);
    const aiConfig = guildConfig.community.ai;
    if (
      aiConfig.enabled &&
      aiConfig.autoReplyEnabled &&
      aiConfig.channelId === message.channelId &&
      isAiAvailable()
    ) {
      const answer = await generateSupportAnswer(message.guild.id, message.content, {
        userTag: message.author.tag,
        channelName: message.channel?.name || null,
      }).catch(() => null);

      if (answer) {
        await message.reply({
          content: answer.slice(0, 1900),
        }).catch(() => null);
      }
    }

    await handleMessageSecurity(client, message);
    await handleLeveling(client, message);
  },
};
