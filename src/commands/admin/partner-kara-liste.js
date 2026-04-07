const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getGuildConfig, patchGuildConfig } = require("../../data/store");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("partner-kara-liste")
    .setDescription("Partnerlik kara listesini yonetir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("islem")
        .setDescription("Yapilacak islem")
        .setRequired(true)
        .addChoices(
          { name: "Ekle", value: "add" },
          { name: "Cikar", value: "remove" },
        ),
    )
    .addUserOption((option) => option.setName("uye").setDescription("Kullanici").setRequired(true)),
  async execute(client, interaction) {
    const action = interaction.options.getString("islem", true);
    const user = interaction.options.getUser("uye", true);
    const config = getGuildConfig(interaction.guildId);
    const list = new Set(config.community.partnership.blacklist || []);

    if (action === "add") list.add(user.id);
    else list.delete(user.id);

    patchGuildConfig(interaction.guildId, {
      community: {
        partnership: {
          blacklist: [...list],
        },
      },
    });

    await interaction.reply({
      embeds: [successEmbed("Partner Kara Liste", `${user.tag} icin islem tamamlandi.`)],
      ephemeral: true,
    });
  },
};

