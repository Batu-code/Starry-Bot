const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { parseDuration, formatDuration } = require("../../utils/time");
const { createEvent } = require("../../modules/community/eventsystem");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("etkinlik-olustur")
    .setDescription("Butonlu katilim sistemi olan bir etkinlik olusturur.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
    .addStringOption((option) => option.setName("baslik").setDescription("Etkinlik basligi").setRequired(true))
    .addStringOption((option) => option.setName("sure").setDescription("Ne zaman baslasin: 2sa, 1g").setRequired(true))
    .addStringOption((option) => option.setName("aciklama").setDescription("Etkinlik aciklamasi").setRequired(true)),
  async execute(client, interaction) {
    const duration = parseDuration(interaction.options.getString("sure", true));
    if (!duration) {
      throw new Error("Gecerli sure gir.");
    }
    const event = await createEvent(interaction, {
      title: interaction.options.getString("baslik", true),
      description: interaction.options.getString("aciklama", true),
      startsAt: Date.now() + duration,
    });
    await interaction.reply({
      embeds: [successEmbed("Etkinlik Olusturuldu", `${event.title} ${formatDuration(duration)} sonra baslayacak.`)],
      ephemeral: true,
    });
  },
};

