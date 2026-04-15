const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getGuildConfig } = require("../../data/store");

function buildSelfRoleButtons(roles) {
  const rows = [];
  let row = new ActionRowBuilder();

  for (const [index, role] of roles.slice(0, 25).entries()) {
    if (index > 0 && index % 5 === 0) {
      rows.push(row);
      row = new ActionRowBuilder();
    }

    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`selfrole:${role.id}`)
        .setLabel(role.label)
        .setStyle(ButtonStyle.Secondary),
    );
  }

  if (row.components.length) {
    rows.push(row);
  }

  return rows;
}

async function toggleSelfRole(interaction, roleId) {
  const guildConfig = getGuildConfig(interaction.guildId);
  const exists = guildConfig.community.selfRoles.some((item) => item.id === roleId);
  if (!exists) {
    throw new Error("Bu rol panelde tanimli degil.");
  }

  const role = interaction.guild.roles.cache.get(roleId);
  if (!role) {
    throw new Error("Rol bulunamadi.");
  }

  if (interaction.member.roles.cache.has(role.id)) {
    await interaction.member.roles.remove(role, "Self role toggle");
    return { added: false, role };
  }

  await interaction.member.roles.add(role, "Self role toggle");
  return { added: true, role };
}

module.exports = {
  buildSelfRoleButtons,
  toggleSelfRole,
};
