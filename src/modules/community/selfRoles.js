const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getGuildConfig } = require("../../data/store");

function buildSelfRoleButtons(roles) {
  const row = new ActionRowBuilder();

  for (const role of roles.slice(0, 5)) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`selfrole:${role.id}`)
        .setLabel(role.label)
        .setStyle(ButtonStyle.Secondary),
    );
  }

  return row;
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

