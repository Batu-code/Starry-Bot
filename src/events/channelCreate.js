const { handleNukeSignal, AuditLogEvent } = require("../modules/security/antiNuke");
const { removeCreatedChannel } = require("../modules/security/rollback");

module.exports = {
  name: "channelCreate",
  async execute(client, channel) {
    if (!channel.guild) {
      return;
    }

    const result = await handleNukeSignal(
      client,
      channel.guild,
      "channelCreate",
      AuditLogEvent.ChannelCreate,
      channel.name,
    );

    if (result?.triggered && result.rollbackEnabled) {
      await removeCreatedChannel(channel).catch(() => null);
    }
  },
};
