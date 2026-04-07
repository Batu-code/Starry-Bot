const { handleNukeSignal, AuditLogEvent } = require("../modules/security/antiNuke");
const { restoreDeletedChannel } = require("../modules/security/rollback");

module.exports = {
  name: "channelDelete",
  async execute(client, channel) {
    if (!channel.guild) {
      return;
    }

    const result = await handleNukeSignal(
      client,
      channel.guild,
      "channelDelete",
      AuditLogEvent.ChannelDelete,
      channel.name,
    );

    if (result?.triggered && result.rollbackEnabled) {
      await restoreDeletedChannel(channel).catch(() => null);
    }
  },
};
