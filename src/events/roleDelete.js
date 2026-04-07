const { handleNukeSignal, AuditLogEvent } = require("../modules/security/antiNuke");
const { restoreDeletedRole } = require("../modules/security/rollback");

module.exports = {
  name: "roleDelete",
  async execute(client, role) {
    const result = await handleNukeSignal(
      client,
      role.guild,
      "roleDelete",
      AuditLogEvent.RoleDelete,
      role.name,
    );

    if (result?.triggered && result.rollbackEnabled) {
      await restoreDeletedRole(role).catch(() => null);
    }
  },
};
