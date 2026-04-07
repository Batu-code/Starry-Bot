const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getGuildConfig } = require("../../data/store");
const { listSnapshots } = require("../../modules/security/snapshots");
const { infoEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ayarlar")
    .setDescription("Sunucu bot ayarlarini ozetler.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(client, interaction) {
    const config = getGuildConfig(interaction.guildId);
    const snapshotCount = listSnapshots().filter((entry) => entry.guildId === interaction.guildId).length;

    const embed = infoEmbed("Sunucu Yapilandirmasi", "Aktif bot ayarlarinin ozetidir.")
      .addFields(
        {
          name: "Guvenlik",
          value: [
            `Log: ${config.security.logChannelId ? `<#${config.security.logChannelId}>` : "Yok"}`,
            `Jail rolu: ${config.security.jailRoleId ? `<@&${config.security.jailRoleId}>` : "Yok"}`,
            `Raid limiti: ${config.security.antiRaid.joinLimit}`,
            `Anti-nuke: ${config.security.antiNuke.enabled ? "Acik" : "Kapali"}`,
            `Rollback: ${config.security.antiNuke.rollbackEnabled ? "Acik" : "Kapali"}`,
            `Anti-phishing: ${config.security.antiPhishing.enabled ? "Acik" : "Kapali"}`,
            `Scam Shield: ${config.security.scamShield.enabled ? "Acik" : "Kapali"}`,
            `Yetkili denetim: ${config.security.moderatorAudit.enabled ? "Acik" : "Kapali"}`,
            `Snapshot sayisi: ${snapshotCount}`,
            `Lockdown: ${config.security.lockdown.active ? "Aktif" : "Kapali"}`,
          ].join("\n"),
        },
        {
          name: "Topluluk",
          value: [
            `Hos geldin: ${config.community.welcomeChannelId ? `<#${config.community.welcomeChannelId}>` : "Yok"}`,
            `Auto rol: ${config.community.autoRoleIds.length || 0}`,
            `Ticket destek rolu: ${config.community.ticket.supportRoleId ? `<@&${config.community.ticket.supportRoleId}>` : "Yok"}`,
            `Temp voice: ${config.community.tempVoice.enabled ? "Acik" : "Kapali"}`,
            `Cekilis rolu: ${config.community.giveaways.managerRoleId ? `<@&${config.community.giveaways.managerRoleId}>` : "Yok"}`,
            `Partnerlik: ${config.community.partnership.enabled ? "Acik" : "Kapali"}`,
            `Partner yonetici: ${config.community.partnership.managerRoleId ? `<@&${config.community.partnership.managerRoleId}>` : "Yok"}`,
            `AI kanal: ${config.community.ai.channelId ? `<#${config.community.ai.channelId}>` : "Yok"}`,
          ].join("\n"),
        },
        {
          name: "Muzik",
          value: [
            `Durum: ${config.music.enabled ? "Acik" : "Kapali"}`,
            `DJ rolu: ${config.music.djRoleId ? `<@&${config.music.djRoleId}>` : "Yok"}`,
            `Ses: ${config.music.defaultVolume}`,
            `Kuyruk limiti: ${config.music.maxQueueSize}`,
            `Otomatik mod: ${config.music.autoplay ? "Acik" : "Kapali"}`,
            `24/7 mod: ${config.music.alwaysOn ? "Acik" : "Kapali"}`,
            `Kayitli playlist: ${Object.keys(config.music.savedPlaylists || {}).length}`,
            `Favori listeler: ${Object.keys(config.music.favoriteTracks || {}).length}`,
          ].join("\n"),
        },
        {
          name: "Moderasyon",
          value: [
            `Toplam case: ${config.moderation.cases.length}`,
            `Aktif timed action: ${config.moderation.timedActions.length}`,
            `Itiraz kanali: ${config.moderation.appealChannelId ? `<#${config.moderation.appealChannelId}>` : "Yok"}`,
            `Ceza merdiveni: ${config.moderation.escalation.enabled ? "Acik" : "Kapali"}`,
            `Uyari > timeout: ${config.moderation.escalation.warnToTimeout}`,
            `Timeout > jail: ${config.moderation.escalation.timeoutToJail}`,
            `Jail > ban: ${config.moderation.escalation.jailToBan}`,
          ].join("\n"),
        },
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
