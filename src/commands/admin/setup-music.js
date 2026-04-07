const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { patchGuildConfig } = require("../../data/store");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("muzik-kur")
    .setDescription("Muzik sistemini ayarlar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption((option) =>
      option.setName("dj_rolu").setDescription("Muzik yonetim rolu").setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("varsayilan_ses")
        .setDescription("Varsayilan ses seviyesi")
        .setMinValue(10)
        .setMaxValue(100)
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("maksimum_kuyruk")
        .setDescription("Kuyruk boyutu")
        .setMinValue(10)
        .setMaxValue(500)
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("otomatik_mod")
        .setDescription("Sarkilar bitince otomatik devam etsin mi")
        .setRequired(false)
        .addChoices(
          { name: "Ac", value: "on" },
          { name: "Kapat", value: "off" },
        ),
    ),
  async execute(client, interaction) {
    const djRole = interaction.options.getRole("dj_rolu");
    const defaultVolume = interaction.options.getInteger("varsayilan_ses");
    const maxQueueSize = interaction.options.getInteger("maksimum_kuyruk");
    const autoplay = interaction.options.getString("otomatik_mod");

    patchGuildConfig(interaction.guildId, {
      music: {
        djRoleId: djRole?.id || null,
        defaultVolume: defaultVolume || 60,
        maxQueueSize: maxQueueSize || 100,
        autoplay: autoplay ? autoplay === "on" : false,
      },
    });

    await interaction.reply({
      embeds: [successEmbed("Muzik Ayarlandi", "DJ rolu ve muzik limitleri kaydedildi.")],
      ephemeral: true,
    });
  },
};
