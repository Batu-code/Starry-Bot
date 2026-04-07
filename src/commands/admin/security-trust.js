const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const { getGuildConfig, patchGuildConfig } = require("../../data/store");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("guvenli-liste")
    .setDescription("Anti-nuke icin guvenilen kullanici listesini yonetir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("islem")
        .setDescription("Liste islem tipi")
        .setRequired(true)
        .addChoices(
          { name: "Ekle", value: "add" },
          { name: "Cikar", value: "remove" },
        ),
    )
    .addUserOption((option) =>
      option.setName("kullanici").setDescription("Guvenilecek kullanici").setRequired(true),
    ),
  async execute(client, interaction) {
    const action = interaction.options.getString("islem", true);
    const user = interaction.options.getUser("kullanici", true);
    const guildConfig = getGuildConfig(interaction.guildId);
    const trusted = new Set(guildConfig.security.trustedUserIds);

    if (action === "add") {
      trusted.add(user.id);
    } else {
      trusted.delete(user.id);
    }

    patchGuildConfig(interaction.guildId, {
      security: {
        trustedUserIds: [...trusted],
      },
    });

    await interaction.reply({
      embeds: [successEmbed("Guven Listesi Guncellendi", `${user.tag} icin islem tamamlandi.`)],
      ephemeral: true,
    });
  },
};
