const { PermissionFlagsBits } = require("discord.js");
const {
  closeTicket,
  createTicketChannel,
  buildTicketTypeButtons,
  buildTicketModal,
  claimTicket,
} = require("../modules/community/tickets");
const { toggleSelfRole } = require("../modules/community/selfRoles");
const {
  updateEventAttendance,
  eventButtons,
  buildEventMessage,
} = require("../modules/community/eventsystem");
const {
  buildPartnershipModal,
  createPartnershipRequest,
  approvePartnership,
  rejectPartnership,
  closePartnershipChannel,
} = require("../modules/community/partnerships");
const {
  buildApplicationModal,
  createApplication,
  isApplicationReviewer,
  reviewApplication,
  closeApplicationChannel,
} = require("../modules/community/applications");
const {
  buildFeedbackModal,
  submitFeedback,
  voteFeedback,
  reviewFeedback,
  isReviewer,
} = require("../modules/community/feedback");
const { auditBotPermissions } = require("../modules/security/permissionAudit");
const { buildProdStatus } = require("../modules/system/runtimeHealth");
const { patchGuildConfig, getGuildConfig } = require("../data/store");
const { addAppeal } = require("../modules/moderation/appeals");
const { infoEmbed, successEmbed, dangerEmbed } = require("../utils/embeds");
const { formatDuration } = require("../utils/time");

function isPartnershipManager(interaction) {
  const config = getGuildConfig(interaction.guildId);
  const managerRoleId = config.community.partnership.managerRoleId;

  if (interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return true;
  }

  return Boolean(managerRoleId && interaction.member.roles.cache.has(managerRoleId));
}

module.exports = {
  name: "interactionCreate",
  async execute(client, interaction) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        return;
      }

      try {
        await command.execute(client, interaction);
      } catch (error) {
        const reply = {
          embeds: [dangerEmbed("Komut Hatasi", error.message || "Beklenmeyen bir hata olustu.")],
          ephemeral: true,
        };

        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(reply).catch(() => null);
        } else {
          await interaction.reply(reply).catch(() => null);
        }
      }

      return;
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === "appeal_modal") {
        try {
          const config = getGuildConfig(interaction.guildId);
          if (!config.moderation.appealChannelId) {
            throw new Error("Itiraz kanali ayarlanmamis.");
          }

          const channel = await interaction.guild.channels.fetch(config.moderation.appealChannelId).catch(() => null);
          if (!channel?.isTextBased()) {
            throw new Error("Itiraz kanali kullanilamiyor.");
          }

          const subject = interaction.fields.getTextInputValue("appeal_subject");
          const body = interaction.fields.getTextInputValue("appeal_body");
          addAppeal(interaction.guildId, {
            id: `${Date.now()}`,
            userId: interaction.user.id,
            subject,
            body,
            createdAt: Date.now(),
          });
          await channel.send({ content: `Yeni itiraz: <@${interaction.user.id}>\n**${subject}**\n${body}` }).catch(() => null);
          await interaction.reply({ embeds: [successEmbed("Itiraz Gonderildi", "Itiraz metnin inceleme kanalina gonderildi.")], ephemeral: true }).catch(() => null);
        } catch (error) {
          await interaction.reply({ embeds: [dangerEmbed("Itiraz Hatasi", error.message)], ephemeral: true }).catch(() => null);
        }
        return;
      }

      if (interaction.customId === "partnership_modal") {
        try {
          const channel = await createPartnershipRequest(interaction);
          await interaction.reply({
            embeds: [successEmbed("Basvuru Gonderildi", `${channel} olusturuldu.`)],
            ephemeral: true,
          }).catch(() => null);
        } catch (error) {
          await interaction.reply({
            embeds: [dangerEmbed("Partnerlik Hatasi", error.message)],
            ephemeral: true,
          }).catch(() => null);
        }
        return;
      }

      if (interaction.customId.startsWith("ticket_modal:")) {
        try {
          const typeId = interaction.customId.split(":")[1];
          const channel = await createTicketChannel(interaction, typeId);
          await interaction.reply({
            embeds: [successEmbed("Ticket Acildi", `${channel} olusturuldu.`)],
            ephemeral: true,
          }).catch(() => null);
        } catch (error) {
          await interaction.reply({
            embeds: [dangerEmbed("Ticket Hatasi", error.message)],
            ephemeral: true,
          }).catch(() => null);
        }
        return;
      }

      if (interaction.customId.startsWith("application_modal:")) {
        try {
          const typeId = interaction.customId.split(":")[1];
          const channel = await createApplication(interaction, typeId);
          await interaction.reply({
            embeds: [successEmbed("Basvuru Gonderildi", `${channel} olusturuldu.`)],
            ephemeral: true,
          }).catch(() => null);
        } catch (error) {
          await interaction.reply({
            embeds: [dangerEmbed("Basvuru Hatasi", error.message)],
            ephemeral: true,
          }).catch(() => null);
        }
        return;
      }

      if (interaction.customId.startsWith("feedback_modal:")) {
        try {
          const kind = interaction.customId.split(":")[1];
          await submitFeedback(interaction, kind);
          await interaction.reply({
            embeds: [successEmbed("Geri Bildirim Gonderildi", "Mesajin basariyla kaydedildi.")],
            ephemeral: true,
          }).catch(() => null);
        } catch (error) {
          await interaction.reply({
            embeds: [dangerEmbed("Geri Bildirim Hatasi", error.message)],
            ephemeral: true,
          }).catch(() => null);
        }
      }

      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId.startsWith("security_action:")) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          await interaction.reply({ embeds: [dangerEmbed("Yetki Hatasi", "Bu panel yalnizca yoneticiler icindir.")], ephemeral: true }).catch(() => null);
          return;
        }

        const action = interaction.customId.split(":")[1];
        if (action === "permissionAudit") {
          const audit = await auditBotPermissions(interaction.guild);
          const description = audit.ok
            ? "Eksik izin bulunmadi."
            : audit.issues
              .slice(0, 10)
              .map((issue) => `${issue.severity === "critical" ? "[Kritik]" : "[Uyari]"} ${issue.label}: ${issue.missingText}`)
              .join("\n");

          await interaction.reply({
            embeds: [infoEmbed("Bot Izin Denetimi", description)],
            ephemeral: true,
          }).catch(() => null);
          return;
        }

        if (action === "prodStatus") {
          const prod = buildProdStatus();
          await interaction.reply({
            embeds: [
              infoEmbed(
                "Prod Durumu",
                [
                  `Durum: **${prod.status}**`,
                  `Saglikli: **${prod.healthy ? "evet" : "hayir"}**`,
                  `PID: **${prod.pid || "-"}**`,
                  `Bellek: **${prod.memoryMb} MB**`,
                  `Uptime: **${formatDuration((prod.uptimeSeconds || 0) * 1000)}**`,
                  `Heartbeat yas: **${prod.ageMs !== null ? formatDuration(prod.ageMs) : "Yok"}**`,
                ].join("\n"),
              ),
            ],
            ephemeral: true,
          }).catch(() => null);
          return;
        }
      }

      if (interaction.customId.startsWith("security_toggle:")) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          await interaction.reply({ embeds: [dangerEmbed("Yetki Hatasi", "Bu panel yalnizca yoneticiler icindir.")], ephemeral: true }).catch(() => null);
          return;
        }

        const key = interaction.customId.split(":")[1];
        const config = getGuildConfig(interaction.guildId);
        const map = {
          antiRaid: ["security", "antiRaid", "enabled"],
          antiSpam: ["security", "antiSpam", "enabled"],
          antiAlt: ["security", "antiAlt", "enabled"],
          antiPhishing: ["security", "antiPhishing", "enabled"],
          risk: ["security", "risk", "enabled"],
          scamShield: ["security", "scamShield", "enabled"],
          moderatorAudit: ["security", "moderatorAudit", "enabled"],
        };
        const path = map[key];
        if (!path) {
          return;
        }

        const currentValue = config[path[0]][path[1]][path[2]];
        patchGuildConfig(interaction.guildId, {
          [path[0]]: {
            [path[1]]: {
              [path[2]]: !currentValue,
            },
          },
        });

        await interaction.reply({
          embeds: [successEmbed("Guvenlik Modulu Guncellendi", `${key} artik **${!currentValue ? "acik" : "kapali"}**`)],
          ephemeral: true,
        }).catch(() => null);
        return;
      }

      if (interaction.customId === "partnership_open") {
        await interaction.showModal(buildPartnershipModal()).catch(() => null);
        return;
      }

      if (interaction.customId.startsWith("feedback_open:")) {
        const kind = interaction.customId.split(":")[1];
        await interaction.showModal(buildFeedbackModal(kind)).catch(() => null);
        return;
      }

      if (interaction.customId.startsWith("feedback_vote:")) {
        try {
          const [, id, direction] = interaction.customId.split(":");
          await voteFeedback(interaction, id, direction);
        } catch (error) {
          await interaction.reply({
            embeds: [dangerEmbed("Oylama Hatasi", error.message)],
            ephemeral: true,
          }).catch(() => null);
        }
        return;
      }

      if (interaction.customId.startsWith("feedback_review:")) {
        if (!isReviewer(interaction)) {
          await interaction.reply({
            embeds: [dangerEmbed("Yetki Hatasi", "Bu geri bildirimi degerlendirmek icin yetkin yok.")],
            ephemeral: true,
          }).catch(() => null);
          return;
        }

        try {
          const [, id, status] = interaction.customId.split(":");
          await reviewFeedback(interaction, id, status);
        } catch (error) {
          await interaction.reply({
            embeds: [dangerEmbed("Inceleme Hatasi", error.message)],
            ephemeral: true,
          }).catch(() => null);
        }
        return;
      }

      if (interaction.customId.startsWith("application_open:")) {
        const typeId = interaction.customId.split(":")[1];
        const type = getGuildConfig(interaction.guildId).community.applications.types.find((entry) => entry.id === typeId);
        if (!type) {
          await interaction.reply({
            embeds: [dangerEmbed("Basvuru Hatasi", "Basvuru tipi bulunamadi.")],
            ephemeral: true,
          }).catch(() => null);
          return;
        }

        await interaction.showModal(buildApplicationModal(typeId, type.label)).catch(() => null);
        return;
      }

      if (interaction.customId === "application_approve") {
        if (!isApplicationReviewer(interaction)) {
          await interaction.reply({
            embeds: [dangerEmbed("Yetki Hatasi", "Bu basvuruyu onaylamak icin yetkin yok.")],
            ephemeral: true,
          }).catch(() => null);
          return;
        }

        try {
          await reviewApplication(interaction, "approved");
          await interaction.reply({
            embeds: [successEmbed("Basvuru Onaylandi", "Basvuru onaylanip arsivlendi.")],
            ephemeral: true,
          }).catch(() => null);
        } catch (error) {
          await interaction.reply({
            embeds: [dangerEmbed("Basvuru Hatasi", error.message)],
            ephemeral: true,
          }).catch(() => null);
        }
        return;
      }

      if (interaction.customId === "application_reject") {
        if (!isApplicationReviewer(interaction)) {
          await interaction.reply({
            embeds: [dangerEmbed("Yetki Hatasi", "Bu basvuruyu reddetmek icin yetkin yok.")],
            ephemeral: true,
          }).catch(() => null);
          return;
        }

        try {
          await reviewApplication(interaction, "rejected");
          await interaction.reply({
            embeds: [successEmbed("Basvuru Reddedildi", "Basvuru reddedilip arsivlendi.")],
            ephemeral: true,
          }).catch(() => null);
        } catch (error) {
          await interaction.reply({
            embeds: [dangerEmbed("Basvuru Hatasi", error.message)],
            ephemeral: true,
          }).catch(() => null);
        }
        return;
      }

      if (interaction.customId === "application_close") {
        if (!isApplicationReviewer(interaction)) {
          await interaction.reply({
            embeds: [dangerEmbed("Yetki Hatasi", "Bu basvuruyu arsivlemek icin yetkin yok.")],
            ephemeral: true,
          }).catch(() => null);
          return;
        }

        try {
          await closeApplicationChannel(interaction);
          await interaction.reply({
            embeds: [successEmbed("Basvuru Arsivlendi", "Kanal arsiv durumuna alindi.")],
            ephemeral: true,
          }).catch(() => null);
        } catch (error) {
          await interaction.reply({
            embeds: [dangerEmbed("Basvuru Hatasi", error.message)],
            ephemeral: true,
          }).catch(() => null);
        }
        return;
      }

      if (interaction.customId.startsWith("event_join:")) {
        try {
          const eventId = interaction.customId.split(":")[1];
          const event = updateEventAttendance(interaction.guildId, eventId, interaction.user.id, true);
          await interaction.message.edit({
            content: buildEventMessage(event),
            components: [eventButtons(event.id)],
          }).catch(() => null);
          await interaction.reply({
            embeds: [successEmbed("Etkinlige Katildin", `${event.title} katilim listesine eklendin.`)],
            ephemeral: true,
          }).catch(() => null);
        } catch (error) {
          await interaction.reply({
            embeds: [dangerEmbed("Etkinlik Hatasi", error.message)],
            ephemeral: true,
          }).catch(() => null);
        }
        return;
      }

      if (interaction.customId.startsWith("event_leave:")) {
        try {
          const eventId = interaction.customId.split(":")[1];
          const event = updateEventAttendance(interaction.guildId, eventId, interaction.user.id, false);
          await interaction.message.edit({
            content: buildEventMessage(event),
            components: [eventButtons(event.id)],
          }).catch(() => null);
          await interaction.reply({
            embeds: [successEmbed("Etkinlikten Ayrildin", `${event.title} katilim listesinden cikarildin.`)],
            ephemeral: true,
          }).catch(() => null);
        } catch (error) {
          await interaction.reply({
            embeds: [dangerEmbed("Etkinlik Hatasi", error.message)],
            ephemeral: true,
          }).catch(() => null);
        }
        return;
      }

      if (interaction.customId === "partnership_approve") {
        if (!isPartnershipManager(interaction)) {
          await interaction.reply({
            embeds: [dangerEmbed("Yetki Hatasi", "Bu islem icin partnerlik yonetici yetkisi gerekli.")],
            ephemeral: true,
          }).catch(() => null);
          return;
        }

        try {
          await approvePartnership(interaction);
          await interaction.reply({
            embeds: [successEmbed("Partnerlik Onaylandi", "Basvuru basariyla onaylandi.")],
            ephemeral: true,
          }).catch(() => null);
        } catch (error) {
          await interaction.reply({
            embeds: [dangerEmbed("Partnerlik Hatasi", error.message)],
            ephemeral: true,
          }).catch(() => null);
        }
        return;
      }

      if (interaction.customId === "partnership_reject") {
        if (!isPartnershipManager(interaction)) {
          await interaction.reply({
            embeds: [dangerEmbed("Yetki Hatasi", "Bu islem icin partnerlik yonetici yetkisi gerekli.")],
            ephemeral: true,
          }).catch(() => null);
          return;
        }

        try {
          await rejectPartnership(interaction);
          await interaction.reply({
            embeds: [successEmbed("Partnerlik Reddedildi", "Basvuru reddedildi ve arsivlendi.")],
            ephemeral: true,
          }).catch(() => null);
        } catch (error) {
          await interaction.reply({
            embeds: [dangerEmbed("Partnerlik Hatasi", error.message)],
            ephemeral: true,
          }).catch(() => null);
        }
        return;
      }

      if (interaction.customId === "partnership_close") {
        if (!isPartnershipManager(interaction)) {
          await interaction.reply({
            embeds: [dangerEmbed("Yetki Hatasi", "Bu islem icin partnerlik yonetici yetkisi gerekli.")],
            ephemeral: true,
          }).catch(() => null);
          return;
        }

        try {
          await closePartnershipChannel(interaction);
          await interaction.reply({
            embeds: [successEmbed("Partnerlik Arsivlendi", "Kanal arsiv kategorisine tasindi.")],
            ephemeral: true,
          }).catch(() => null);
        } catch (error) {
          await interaction.reply({
            embeds: [dangerEmbed("Partnerlik Hatasi", error.message)],
            ephemeral: true,
          }).catch(() => null);
        }
        return;
      }

      if (interaction.customId === "ticket_open") {
        await interaction.reply({
          embeds: [infoEmbed("Ticket Turu Sec", "Asagidaki butonlardan ticket turunu sec ve formu doldur.")],
          components: buildTicketTypeButtons(interaction.guildId),
          ephemeral: true,
        }).catch(() => null);
        return;
      }

      if (interaction.customId.startsWith("ticket_type:")) {
        const typeId = interaction.customId.split(":")[1];
        const type = getGuildConfig(interaction.guildId).community.ticket.types.find((entry) => entry.id === typeId);
        if (!type) {
          await interaction.reply({
            embeds: [dangerEmbed("Ticket Hatasi", "Ticket tipi bulunamadi.")],
            ephemeral: true,
          }).catch(() => null);
          return;
        }
        await interaction.showModal(buildTicketModal(typeId, type.label)).catch(() => null);
        return;
      }

      if (interaction.customId === "ticket_close" || interaction.customId.startsWith("ticket_close:")) {
        try {
          const recordId = interaction.customId.includes(":") ? interaction.customId.split(":")[1] : null;
          await interaction.reply({
            embeds: [infoEmbed("Ticket Kapatiliyor", "HTML transcript aliniyor ve ticket arsivleniyor.")],
            ephemeral: true,
          }).catch(() => null);
          await closeTicket(interaction, recordId);
        } catch (error) {
          await interaction.followUp({
            embeds: [dangerEmbed("Ticket Hatasi", error.message)],
            ephemeral: true,
          }).catch(() => null);
        }
        return;
      }

      if (interaction.customId === "ticket_claim" || interaction.customId.startsWith("ticket_claim:")) {
        try {
          const recordId = interaction.customId.includes(":") ? interaction.customId.split(":")[1] : null;
          await claimTicket(interaction, recordId);
          await interaction.reply({
            embeds: [successEmbed("Ticket Ustlenildi", `${interaction.user} bu ticket ile ilgileniyor.`)],
            ephemeral: true,
          }).catch(() => null);
        } catch (error) {
          await interaction.reply({
            embeds: [dangerEmbed("Ticket Hatasi", error.message)],
            ephemeral: true,
          }).catch(() => null);
        }
        return;
      }

      if (interaction.customId === "verify_member") {
        try {
          const guildConfig = getGuildConfig(interaction.guildId);
          const verifiedRoleId = guildConfig.security.verifiedRoleId;
          const unverifiedRoleId = guildConfig.security.unverifiedRoleId;

          if (!verifiedRoleId) {
            throw new Error("Dogrulama rolu ayarlanmamis.");
          }

          const verifiedRole = interaction.guild.roles.cache.get(verifiedRoleId);
          const unverifiedRole = unverifiedRoleId
            ? interaction.guild.roles.cache.get(unverifiedRoleId)
            : null;

          if (verifiedRole) {
            await interaction.member.roles.add(verifiedRole).catch(() => null);
          }

          if (unverifiedRole && interaction.member.roles.cache.has(unverifiedRole.id)) {
            await interaction.member.roles.remove(unverifiedRole).catch(() => null);
          }

          await interaction.reply({
            embeds: [successEmbed("Dogrulama Tamam", "Artik tam erisim sahibisin.")],
            ephemeral: true,
          }).catch(() => null);
        } catch (error) {
          await interaction.reply({
            embeds: [dangerEmbed("Dogrulama Hatasi", error.message)],
            ephemeral: true,
          }).catch(() => null);
        }
        return;
      }

      if (interaction.customId.startsWith("selfrole:")) {
        const roleId = interaction.customId.split(":")[1];

        try {
          const result = await toggleSelfRole(interaction, roleId);
          await interaction.reply({
            embeds: [
              successEmbed(
                result.added ? "Rol Verildi" : "Rol Kaldirildi",
                `${result.role.name} rolunde durumun guncellendi.`,
              ),
            ],
            ephemeral: true,
          }).catch(() => null);
        } catch (error) {
          await interaction.reply({
            embeds: [dangerEmbed("Rol Islem Hatasi", error.message)],
            ephemeral: true,
          }).catch(() => null);
        }
      }
    }
  },
};
