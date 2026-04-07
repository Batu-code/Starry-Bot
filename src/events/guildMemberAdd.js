const { getGuildConfig } = require("../data/store");
const { handleMemberJoin } = require("../modules/security/antiRaid");
const { handleAltProtection } = require("../modules/security/antiAlt");
const { sendLog } = require("../modules/logging/sendLog");
const { COLORS } = require("../constants");
const { detectInviteUse } = require("../modules/security/inviteTracker");

module.exports = {
  name: "guildMemberAdd",
  async execute(client, member) {
    const guildConfig = getGuildConfig(member.guild.id);

    for (const roleId of guildConfig.community.autoRoleIds) {
      const role = member.guild.roles.cache.get(roleId);
      if (role) {
        await member.roles.add(role, "Auto role").catch(() => null);
      }
    }

    if (guildConfig.security.unverifiedRoleId) {
      const role = member.guild.roles.cache.get(guildConfig.security.unverifiedRoleId);
      if (role) {
        await member.roles.add(role, "Verification pending").catch(() => null);
      }
    }

    const welcomeChannel = guildConfig.community.welcomeChannelId
      ? await member.guild.channels.fetch(guildConfig.community.welcomeChannelId).catch(() => null)
      : null;

    if (welcomeChannel?.isTextBased()) {
      const content = guildConfig.community.welcomeMessage.replace("{user}", `${member}`);
      await welcomeChannel.send({ content }).catch(() => null);
    }

    const raidState = await handleMemberJoin(client, member);
    await handleAltProtection(member).catch(() => null);
    await detectInviteUse(member).catch(() => null);

    await sendLog(member.guild, {
      color: raidState.raidMode ? COLORS.warning : COLORS.success,
      title: "Yeni Uye",
      description: `${member.user.tag} sunucuya katildi.`,
      fields: [
        { name: "Hesap", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "Raid Modu", value: raidState.raidMode ? "Aktif" : "Kapali", inline: true },
      ],
    });
  },
};
