const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getGuildConfig, patchGuildConfig } = require("../../data/store");
const { parseDuration, formatDuration } = require("../../utils/time");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ceza-merdiveni")
    .setDescription("Otomatik ceza merdiveni ayarlarini gunceller.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) =>
      option
        .setName("durum")
        .setDescription("Sistemin durumu")
        .setRequired(true)
        .addChoices(
          { name: "Ac", value: "on" },
          { name: "Kapat", value: "off" },
        ),
    )
    .addIntegerOption((option) =>
      option.setName("uyari_esik").setDescription("Kac uyaridan sonra timeout gelsin").setMinValue(2),
    )
    .addStringOption((option) =>
      option.setName("timeout_sure").setDescription("Otomatik timeout suresi: 30dk, 2sa"),
    )
    .addIntegerOption((option) =>
      option.setName("timeout_esik").setDescription("Kac timeouttan sonra jail gelsin").setMinValue(1),
    )
    .addStringOption((option) =>
      option.setName("jail_sure").setDescription("Otomatik jail suresi: 1g, 12sa"),
    )
    .addIntegerOption((option) =>
      option.setName("jail_esik").setDescription("Kac jail'den sonra ban gelsin").setMinValue(1),
    )
    .addIntegerOption((option) =>
      option.setName("pencere_gun").setDescription("Ihlallerin sayilacagi sure penceresi").setMinValue(1),
    ),
  async execute(client, interaction) {
    const timeoutDuration = interaction.options.getString("timeout_sure");
    const jailDuration = interaction.options.getString("jail_sure");
    const parsedTimeout = timeoutDuration ? parseDuration(timeoutDuration) : null;
    const parsedJail = jailDuration ? parseDuration(jailDuration) : null;

    if (timeoutDuration && !parsedTimeout) {
      throw new Error("Timeout suresi gecersiz.");
    }

    if (jailDuration && !parsedJail) {
      throw new Error("Jail suresi gecersiz.");
    }

    const current = getGuildConfig(interaction.guildId).moderation.escalation;
    patchGuildConfig(interaction.guildId, {
      moderation: {
        escalation: {
          enabled: interaction.options.getString("durum", true) === "on",
          warnToTimeout: interaction.options.getInteger("uyari_esik") ?? current.warnToTimeout,
          timeoutDurationMs: parsedTimeout ?? current.timeoutDurationMs,
          timeoutToJail: interaction.options.getInteger("timeout_esik") ?? current.timeoutToJail,
          jailDurationMs: parsedJail ?? current.jailDurationMs,
          jailToBan: interaction.options.getInteger("jail_esik") ?? current.jailToBan,
          windowDays: interaction.options.getInteger("pencere_gun") ?? current.windowDays,
        },
      },
    });

    const next = getGuildConfig(interaction.guildId).moderation.escalation;
    await interaction.reply({
      embeds: [
        successEmbed(
          "Ceza Merdiveni Guncellendi",
          [
            `Durum: **${next.enabled ? "acik" : "kapali"}**`,
            `Uyari > timeout: **${next.warnToTimeout}**`,
            `Timeout suresi: **${formatDuration(next.timeoutDurationMs)}**`,
            `Timeout > jail: **${next.timeoutToJail}**`,
            `Jail suresi: **${formatDuration(next.jailDurationMs)}**`,
            `Jail > ban: **${next.jailToBan}**`,
            `Pencere: **${next.windowDays} gun**`,
          ].join("\n"),
        ),
      ],
      ephemeral: true,
    });
  },
};
