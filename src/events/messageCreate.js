const { handleMessageSecurity } = require("../modules/security/antiSpam");
const { handlePhishingProtection } = require("../modules/security/antiPhishing");
const { handleScamShield } = require("../modules/security/scamShield");
const { handleAutoResponses } = require("../modules/community/autoResponses");
const { handlePrefixCommand } = require("../modules/community/prefixCommands");
const { handleCustomCommand } = require("../modules/community/customCommands");
const { getGuildConfig } = require("../data/store");
const { generateSupportAnswer, isAiAvailable } = require("../modules/ai/openai");
const { recordMessageActivity } = require("../modules/progression/ranking");
const { evaluateAutoStaff } = require("../modules/community/staffRecruitment");

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

    const prefixHandled = await handlePrefixCommand(message);
    if (prefixHandled) {
      return;
    }

    const customHandled = await handleCustomCommand(message);
    if (customHandled) {
      return;
    }

    await handleAutoResponses(message);

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

    const blocked = await handleMessageSecurity(client, message);
    if (blocked) {
      return;
    }

    await recordMessageActivity(client, message);
    await evaluateAutoStaff(message.member, "Chat seviyesi ile otomatik yetkili alim").catch(() => null);
  },
};
