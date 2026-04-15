const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { patchGuildConfig, getGuildConfig } = require("../../data/store");
const { ticketButtons } = require("../../modules/community/tickets");
const { buildApplicationButtons } = require("../../modules/community/applications");
const { panelButtons } = require("../../modules/community/feedback");
const { infoEmbed, successEmbed } = require("../../utils/embeds");

async function ensureRole(guild, name) {
  const existing = guild.roles.cache.find((role) => role.name === name);
  if (existing) {
    return existing;
  }
  return guild.roles.create({ name, reason: "Bocchi setup sihirbazi" });
}

async function ensureCategory(guild, name) {
  const existing = guild.channels.cache.find((channel) => channel.type === ChannelType.GuildCategory && channel.name === name);
  if (existing) {
    return existing;
  }
  return guild.channels.create({ name, type: ChannelType.GuildCategory, reason: "Bocchi setup sihirbazi" });
}

async function ensureTextChannel(guild, name, parent = null) {
  const existing = guild.channels.cache.find((channel) => channel.type === ChannelType.GuildText && channel.name === name);
  if (existing) {
    return existing;
  }
  return guild.channels.create({ name, type: ChannelType.GuildText, parent: parent?.id || undefined, reason: "Bocchi setup sihirbazi" });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup-sihirbazi")
    .setDescription("Bocchi icin temel kanal, rol ve panelleri hazirlar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption((option) =>
      option.setName("panel_gonder").setDescription("Panelleri otomatik gondersin mi").setRequired(false),
    ),
  async execute(client, interaction) {
    const sendPanels = interaction.options.getBoolean("panel_gonder") ?? true;
    await interaction.deferReply({ ephemeral: true });

    const supportRole = await ensureRole(interaction.guild, "Bocchi Destek Ekibi");
    const boosterRole = await ensureRole(interaction.guild, "Bocchi Booster");
    const reviewerRole = await ensureRole(interaction.guild, "Bocchi Inceleme");

    const communityCategory = await ensureCategory(interaction.guild, "Bocchi Topluluk");
    const ticketCategory = await ensureCategory(interaction.guild, "Bocchi Ticket");
    const archiveCategory = await ensureCategory(interaction.guild, "Bocchi Arsiv");
    const applicationCategory = await ensureCategory(interaction.guild, "Bocchi Basvurular");

    const welcomeChannel = await ensureTextChannel(interaction.guild, "hosgeldin", communityCategory);
    const logChannel = await ensureTextChannel(interaction.guild, "bocchi-log", communityCategory);
    const ticketPanelChannel = await ensureTextChannel(interaction.guild, "ticket-panel", communityCategory);
    const transcriptChannel = await ensureTextChannel(interaction.guild, "ticket-transcript", archiveCategory);
    const applicationPanelChannel = await ensureTextChannel(interaction.guild, "basvuru-panel", communityCategory);
    const suggestionPanelChannel = await ensureTextChannel(interaction.guild, "geri-bildirim", communityCategory);
    const suggestionChannel = await ensureTextChannel(interaction.guild, "oneriler", communityCategory);
    const complaintChannel = await ensureTextChannel(interaction.guild, "sikayetler", communityCategory);
    const weeklyReportChannel = await ensureTextChannel(interaction.guild, "haftalik-rapor", communityCategory);

    patchGuildConfig(interaction.guildId, {
      security: {
        logChannelId: logChannel.id,
      },
      community: {
        logChannelId: logChannel.id,
        welcomeChannelId: welcomeChannel.id,
        leaveChannelId: welcomeChannel.id,
        boost: {
          channelId: welcomeChannel.id,
          roleId: boosterRole.id,
        },
        ticket: {
          categoryId: ticketCategory.id,
          archiveCategoryId: archiveCategory.id,
          panelChannelId: ticketPanelChannel.id,
          transcriptChannelId: transcriptChannel.id,
          logChannelId: logChannel.id,
          supportRoleId: supportRole.id,
        },
        applications: {
          enabled: true,
          categoryId: applicationCategory.id,
          panelChannelId: applicationPanelChannel.id,
          logChannelId: logChannel.id,
          reviewRoleId: reviewerRole.id,
        },
        feedback: {
          enabled: true,
          panelChannelId: suggestionPanelChannel.id,
          suggestionChannelId: suggestionChannel.id,
          complaintChannelId: complaintChannel.id,
          logChannelId: logChannel.id,
          reviewRoleId: reviewerRole.id,
        },
      },
      automation: {
        weeklyReports: {
          enabled: true,
          channelId: weeklyReportChannel.id,
          dayOfWeek: 1,
          hour: 21,
          minute: 0,
          timeZone: "Europe/Istanbul",
        },
      },
    });

    if (sendPanels) {
      await ticketPanelChannel.send({
        embeds: [infoEmbed("Bocchi Ticket Merkezi", "Butona tiklayip destek talebi acabilirsin.")],
        components: [ticketButtons()],
      }).catch(() => null);

      await applicationPanelChannel.send({
        embeds: [infoEmbed("Bocchi Basvuru Merkezi", "Uygun ekibe basvurmak icin bir form sec.")],
        components: buildApplicationButtons(getGuildConfig(interaction.guildId).community.applications.types),
      }).catch(() => null);

      await suggestionPanelChannel.send({
        embeds: [infoEmbed("Bocchi Geri Bildirim", "Oneri ve sikayetlerini bize ilet.")],
        components: panelButtons(),
      }).catch(() => null);
    }

    await interaction.editReply({
      embeds: [
        successEmbed(
          "Setup Tamamlandi",
          [
            `Log: ${logChannel}`,
            `Hosgeldin: ${welcomeChannel}`,
            `Ticket Panel: ${ticketPanelChannel}`,
            `Basvuru Panel: ${applicationPanelChannel}`,
            `Geri Bildirim: ${suggestionPanelChannel}`,
            `Haftalik Rapor: ${weeklyReportChannel}`,
            `Destek Rolu: <@&${supportRole.id}>`,
          ].join("\n"),
        ),
      ],
    });
  },
};
