const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const { patchGuildConfig } = require("../../data/store");
const { buildSelfRoleButtons } = require("../../modules/community/selfRoles");
const { successEmbed, infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rol-paneli")
    .setDescription("Kullanicilarin kendi rollerini secmesi icin panel gonderir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addRoleOption((option) => option.setName("rol_1").setDescription("Ilk rol").setRequired(true))
    .addRoleOption((option) => option.setName("rol_2").setDescription("Ikinci rol").setRequired(true))
    .addRoleOption((option) => option.setName("rol_3").setDescription("Ucuncu rol").setRequired(false))
    .addRoleOption((option) => option.setName("rol_4").setDescription("Dorduncu rol").setRequired(false))
    .addRoleOption((option) => option.setName("rol_5").setDescription("Besinci rol").setRequired(false)),
  async execute(client, interaction) {
    const roles = ["rol_1", "rol_2", "rol_3", "rol_4", "rol_5"]
      .map((name) => interaction.options.getRole(name))
      .filter(Boolean)
      .map((role) => ({ id: role.id, label: role.name }));

    patchGuildConfig(interaction.guildId, {
      community: {
        selfRoles: roles,
      },
    });

    await interaction.channel.send({
      embeds: [infoEmbed("Rol Paneli", "Istegin role butonlardan tiklayarak giris yapabilirsin.")],
      components: [buildSelfRoleButtons(roles)],
    });

    await interaction.reply({
      embeds: [successEmbed("Rol Paneli Hazir", "Rol secim paneli gonderildi.")],
      ephemeral: true,
    });
  },
};
