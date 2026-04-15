const { sendLog } = require("../modules/logging/sendLog");
const { COLORS } = require("../constants");
const { getGuildConfig } = require("../data/store");
const { buildTemplateContext, applyTemplate } = require("../modules/community/templates");

module.exports = {
  name: "guildMemberUpdate",
  async execute(client, oldMember, newMember) {
    const guildConfig = getGuildConfig(newMember.guild.id);

    const justBoosted = !oldMember.premiumSince && Boolean(newMember.premiumSince);
    const boostEnded = Boolean(oldMember.premiumSince) && !newMember.premiumSince;
    if (justBoosted) {
      const boostConfig = guildConfig.community.boost;
      const boostChannel = boostConfig.channelId
        ? await newMember.guild.channels.fetch(boostConfig.channelId).catch(() => null)
        : null;

      if (boostChannel?.isTextBased()) {
        const content = applyTemplate(
          boostConfig.message,
          buildTemplateContext({
            user: `${newMember}`,
            userTag: newMember.user.tag,
            username: newMember.user.username,
            guild: newMember.guild.name,
            memberCount: newMember.guild.memberCount,
            boostCount: newMember.guild.premiumSubscriptionCount || 0,
          }),
        );
        await boostChannel.send({ content }).catch(() => null);
      }

      if (boostConfig.roleId && !newMember.roles.cache.has(boostConfig.roleId)) {
        const boostRole = newMember.guild.roles.cache.get(boostConfig.roleId);
        if (boostRole) {
          await newMember.roles.add(boostRole, "Sunucuyu boostladigi icin ozel rol verildi").catch(() => null);
        }
      }

      await sendLog(newMember.guild, {
        color: COLORS.success,
        title: "Sunucu Boostlandi",
        description: `${newMember.user.tag} sunucuyu boostladi.`,
        fields: [{ name: "Toplam Boost", value: String(newMember.guild.premiumSubscriptionCount || 0), inline: true }],
      });
    }

    if (boostEnded && guildConfig.community.boost.roleId && newMember.roles.cache.has(guildConfig.community.boost.roleId)) {
      const boostRole = newMember.guild.roles.cache.get(guildConfig.community.boost.roleId);
      if (boostRole) {
        await newMember.roles.remove(boostRole, "Boost suresi bittigi icin rol kaldirildi").catch(() => null);
      }
    }

    if (oldMember.nickname !== newMember.nickname) {
      await sendLog(newMember.guild, {
        color: COLORS.primary,
        title: "Takma Ad Guncellendi",
        description: `${newMember.user.tag} kullanicisinin takma adi degisti.`,
        fields: [
          { name: "Eski", value: oldMember.nickname || "Yok", inline: true },
          { name: "Yeni", value: newMember.nickname || "Yok", inline: true },
        ],
      });
    }

    const oldRoles = oldMember.roles.cache.filter((role) => !newMember.roles.cache.has(role.id));
    const newRoles = newMember.roles.cache.filter((role) => !oldMember.roles.cache.has(role.id));

    if (oldRoles.size || newRoles.size) {
      await sendLog(newMember.guild, {
        color: COLORS.primary,
        title: "Rol Guncellemesi",
        description: `${newMember.user.tag} kullanicisinin rolleri degisti.`,
        fields: [
          {
            name: "Eklenen",
            value: newRoles.size ? newRoles.map((role) => role.toString()).join(", ").slice(0, 1024) : "Yok",
            inline: false,
          },
          {
            name: "Kaldirilan",
            value: oldRoles.size ? oldRoles.map((role) => role.toString()).join(", ").slice(0, 1024) : "Yok",
            inline: false,
          },
        ],
      });
    }
  },
};
