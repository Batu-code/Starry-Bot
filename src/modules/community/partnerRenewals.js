const { getGuildConfig, patchGuildConfig } = require("../../data/store");
const { sendLog } = require("../logging/sendLog");
const { COLORS } = require("../../constants");

function extendPartner(guildId, serverName, days) {
  const config = getGuildConfig(guildId);
  const partners = [...(config.community.partnership.partners || [])];
  const index = partners.findIndex((entry) => entry.serverName.toLowerCase() === serverName.toLowerCase());
  if (index === -1) {
    throw new Error("Partner bulunamadi.");
  }
  const currentExpiry = partners[index].expiresAt || Date.now();
  partners[index].expiresAt = Math.max(Date.now(), currentExpiry) + days * 24 * 60 * 60 * 1000;
  partners[index].renewedAt = Date.now();
  patchGuildConfig(guildId, {
    community: {
      partnership: {
        partners,
      },
    },
  });
  return partners[index];
}

async function processPartnerRenewals(client) {
  for (const guild of client.guilds.cache.values()) {
    const config = getGuildConfig(guild.id);
    const settings = config.community.partnership;
    if (!settings.enabled) {
      continue;
    }

    const partners = [...(settings.partners || [])];
    let changed = false;
    for (const partner of partners) {
      if (!partner.expiresAt) {
        partner.expiresAt = (partner.approvedAt || Date.now()) + settings.renewEveryDays * 24 * 60 * 60 * 1000;
        changed = true;
      }

      const daysLeft = Math.ceil((partner.expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
      if (!partner.renewalNoticeSent && daysLeft <= settings.renewalNoticeDays && daysLeft >= 0) {
        await sendLog(guild, {
          channelId: settings.logChannelId || undefined,
          color: COLORS.warning,
          title: "Partner Yenileme Yaklasti",
          description: `${partner.serverName} partnerligi yakinda yenilenmeli.`,
          fields: [
            { name: "Kalan Gun", value: String(daysLeft), inline: true },
          ],
        });
        partner.renewalNoticeSent = true;
        changed = true;
      }
    }

    if (changed) {
      patchGuildConfig(guild.id, {
        community: {
          partnership: {
            partners,
          },
        },
      });
    }
  }
}

module.exports = {
  extendPartner,
  processPartnerRenewals,
};

