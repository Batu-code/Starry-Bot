const { ActivityType } = require("discord.js");
const logger = require("../utils/logger");
const { startReminderLoop } = require("../modules/community/reminders");
const { setupPlayer } = require("../modules/music/player");
const { refreshStats } = require("../modules/community/stats");
const { releaseExpiredRaidModes } = require("../modules/security/antiRaid");
const { cacheGuildInvites } = require("../modules/security/inviteTracker");
const { startGiveawayLoop } = require("../modules/community/giveaways");
const { processTimedActions } = require("../modules/moderation/actions");
const { processAnnouncements } = require("../modules/community/announcements");
const { processEventReminders } = require("../modules/community/eventsystem");
const { processPartnerRenewals } = require("../modules/community/partnerRenewals");
const { processAutoMessages } = require("../modules/community/autoMessages");
const { processAutoSnapshots } = require("../modules/security/snapshots");
const { processWeeklyReports } = require("../modules/community/weeklyReports");
const { markReady, markHeartbeat } = require("../modules/system/runtimeHealth");

module.exports = {
  name: "clientReady",
  once: true,
  async execute(client) {
    logger.info(`Bot logged in as ${client.user.tag}`);
    client.user.setActivity("Bocchi olarak sunucuyu yonetiyor", {
      type: ActivityType.Playing,
    });

    await setupPlayer(client);
    startReminderLoop(client);
    startGiveawayLoop(client);
    markReady(client);

    for (const guild of client.guilds.cache.values()) {
      await guild.members.fetch().catch(() => null);
      await refreshStats(guild).catch(() => null);
      await cacheGuildInvites(guild).catch(() => null);
    }

    setInterval(async () => {
      markHeartbeat(client);
      await processAutoMessages(client).catch(() => null);
      await processTimedActions(client).catch(() => null);
    }, 60 * 1000);

    setInterval(async () => {
      for (const guild of client.guilds.cache.values()) {
        await refreshStats(guild).catch(() => null);
        await cacheGuildInvites(guild).catch(() => null);
      }
      await releaseExpiredRaidModes(client).catch(() => null);
      await processAnnouncements(client).catch(() => null);
      await processEventReminders(client).catch(() => null);
      await processPartnerRenewals(client).catch(() => null);
      await processAutoSnapshots(client).catch(() => null);
      await processWeeklyReports(client).catch(() => null);
    }, 5 * 60 * 1000);
  },
};
