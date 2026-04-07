const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { createGiveaway, publishGiveaway } = require("../../modules/community/giveaways");
const { parseDuration } = require("../../utils/time");
const { successEmbed } = require("../../utils/embeds");
const { getGuildConfig } = require("../../data/store");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cekilis")
    .setDescription("Yeni bir cekilis baslatir.")
    .addStringOption((option) =>
      option.setName("odul").setDescription("Cekilis odulu").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("sure").setDescription("Ornek: 10dk, 2sa, 1g").setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("kazanan")
        .setDescription("Kazanan sayisi")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10),
    ),
  async execute(client, interaction) {
    const guildConfig = getGuildConfig(interaction.guildId);
    const managerRoleId = guildConfig.community.giveaways?.managerRoleId;
    if (
      managerRoleId &&
      !interaction.member.permissions.has(PermissionFlagsBits.ManageEvents) &&
      !interaction.member.roles.cache.has(managerRoleId)
    ) {
      throw new Error("Bu komut icin cekilis yonetici rolune ihtiyacin var.");
    }

    const prize = interaction.options.getString("odul", true);
    const duration = parseDuration(interaction.options.getString("sure", true));
    const winnerCount = interaction.options.getInteger("kazanan") || 1;

    if (!duration) {
      throw new Error("Gecerli bir sure gir.");
    }

    const giveaway = createGiveaway({
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      createdBy: interaction.user.id,
      prize,
      winnerCount,
      endsAt: Date.now() + duration,
    });

    await publishGiveaway(interaction.channel, giveaway);
    await interaction.reply({
      embeds: [successEmbed("Cekilis Baslatildi", `Odul: **${prize}**`)],
      ephemeral: true,
    });
  },
};
