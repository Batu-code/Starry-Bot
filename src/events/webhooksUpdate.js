const { handleNukeSignal, AuditLogEvent } = require("../modules/security/antiNuke");

module.exports = {
  name: "webhooksUpdate",
  async execute(client, channel) {
    await handleNukeSignal(
      client,
      channel.guild,
      "webhookUpdate",
      AuditLogEvent.WebhookCreate,
      channel.name,
    );
  },
};

