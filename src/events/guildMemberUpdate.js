const { sendLog } = require("../modules/logging/sendLog");
const { COLORS } = require("../constants");

module.exports = {
  name: "guildMemberUpdate",
  async execute(client, oldMember, newMember) {
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

