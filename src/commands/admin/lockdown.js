const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const { setLockdown } = require("../../modules/security/lockdown");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kilit")
    .setDescription("Sunucuda yazisma ve baglanti kilidi uygular.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) =>
      option
        .setName("durum")
        .setDescription("Lockdown durumu")
        .setRequired(true)
        .addChoices(
          { name: "Ac", value: "on" },
          { name: "Kapat", value: "off" },
        ),
    )
    .addStringOption((option) =>
      option.setName("sebep").setDescription("Islem sebebi").setRequired(false),
    ),
  async execute(client, interaction) {
    const state = interaction.options.getString("durum", true);
    const reason = interaction.options.getString("sebep") || "Manuel islem";

    await setLockdown(interaction.guild, state === "on", reason);

    await interaction.reply({
      embeds: [successEmbed("Lockdown Guncellendi", `Yeni durum: **${state}**`)],
      ephemeral: true,
    });
  },
};
