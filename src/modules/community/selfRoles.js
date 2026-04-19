const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

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

function messageContainsRoleButton(message, roleId) {
  if (!message?.components?.length) {
    return false;
  }

  return message.components.some((row) =>
    row.components.some((component) => component.customId === `selfrole:${roleId}`));
}

async function toggleSelfRole(interaction, roleId) {
  if (!messageContainsRoleButton(interaction.message, roleId)) {
    throw new Error("Bu rol panelde tanimli degil.");
  }

  const role = interaction.guild.roles.cache.get(roleId);
  if (!role) {
    throw new Error("Rol bulunamadi.");
  }

  if (role.managed) {
    throw new Error("Bu rol elle verilip kaldirilamaz.");
  }

  if (!role.editable) {
    throw new Error("Bu rolu yonetemiyorum. Rol siralarini kontrol et.");
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
