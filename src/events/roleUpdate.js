const { sendLog } = require("../modules/logging/sendLog");
const { COLORS } = require("../constants");

module.exports = {
  name: "roleUpdate",
  async execute(client, oldRole, newRole) {
    const changes = [];
    if (oldRole.name !== newRole.name) {
      changes.push(`Isim: ${oldRole.name} -> ${newRole.name}`);
    }
    if (oldRole.color !== newRole.color) {
      changes.push("Rol rengi degisti");
    }
    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
      changes.push("Rol izinleri guncellendi");
    }

    if (!changes.length) {
      return;
    }

    await sendLog(newRole.guild, {
      color: COLORS.primary,
      title: "Rol Guncellendi",
      description: `${newRole.name} rolunde degisiklik algilandi.`,
      fields: [{ name: "Degisiklikler", value: changes.join("\n").slice(0, 1024), inline: false }],
    });
  },
};
