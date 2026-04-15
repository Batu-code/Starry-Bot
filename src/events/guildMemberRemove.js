const { sendLog } = require("../modules/logging/sendLog");
const { COLORS } = require("../constants");
const { getGuildConfig } = require("../data/store");
const { buildTemplateContext, applyTemplate } = require("../modules/community/templates");
const { handleTrackedInviteLeave } = require("../modules/security/inviteTracker");

module.exports = {
  name: "guildMemberRemove",
  async execute(client, member) {
    await handleTrackedInviteLeave(member).catch(() => null);
    const guildConfig = getGuildConfig(member.guild.id);
    const leaveChannel = guildConfig.community.leaveChannelId
      ? await member.guild.channels.fetch(guildConfig.community.leaveChannelId).catch(() => null)
      : null;

    if (leaveChannel?.isTextBased()) {
      const content = applyTemplate(
        guildConfig.community.leaveMessage,
        buildTemplateContext({
          user: `${member}`,
          userTag: member.user.tag,
          username: member.user.username,
          guild: member.guild.name,
          memberCount: member.guild.memberCount,
          boostCount: member.guild.premiumSubscriptionCount || 0,
        }),
      );
      await leaveChannel.send({ content }).catch(() => null);
    }

    await sendLog(member.guild, {
      color: COLORS.muted,
      title: "Uye Ayrildi",
      description: `${member.user.tag} sunucudan ayrildi.`,
    });
  },
};
