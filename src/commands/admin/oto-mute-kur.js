const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { patchGuildConfig } = require("../../data/store");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("oto-mute-kur")
    .setDescription("Spam ve yasakli kelime durumlari icin oto mute ayari yapar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption((option) =>
      option.setName("aktif").setDescription("Oto mute aktif olsun mu?").setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("sure_dakika")
        .setDescription("Uygulanacak timeout suresi")
        .setMinValue(1)
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("yasakli_kelimeler")
        .setDescription("Virgulle ayrilmis yasakli kelimeler")
        .setRequired(false),
    ),
  async execute(client, interaction) {
    const enabled = interaction.options.getBoolean("aktif", true);
    const durationMinutes = interaction.options.getInteger("sure_dakika");
    const blockedWordsRaw = interaction.options.getString("yasakli_kelimeler");
    const blockedWords = blockedWordsRaw
      ? blockedWordsRaw.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean)
      : undefined;

    patchGuildConfig(interaction.guildId, {
      security: {
        autoMute: {
          enabled,
          durationMs: durationMinutes ? durationMinutes * 60 * 1000 : undefined,
          blockedWords,
        },
      },
    });

    await interaction.reply({
      embeds: [successEmbed("Oto Mute Guncellendi", "Yeni otomatik mute ayarlari kaydedildi.")],
      ephemeral: true,
    });
  },
};
