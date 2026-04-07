const { handleNukeSignal, AuditLogEvent } = require("../modules/security/antiNuke");
const { removeCreatedRole } = require("../modules/security/rollback");

module.exports = {
  name: "roleCreate",
  async execute(client, role) {
    const result = await handleNukeSignal(
      client,
      role.guild,
      "roleCreate",
      AuditLogEvent.RoleCreate,
      role.name,
    );

    if (result?.triggered && result.rollbackEnabled) {
      await removeCreatedRole(role).catch(() => null);
    }
  },
};
