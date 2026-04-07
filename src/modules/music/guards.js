const { PermissionFlagsBits } = require("discord.js");
const { getGuildConfig } = require("../../data/store");

function assertVoiceAccess(interaction, queue) {
  const memberVoice = interaction.member.voice.channel;
  if (!memberVoice) {
    throw new Error("Once bir ses kanalina girmen gerekiyor.");
  }

  if (queue?.channel && queue.channel.id !== memberVoice.id) {
    throw new Error("Bot ile ayni ses kanalinda olmalisin.");
  }
}

function assertDjAccess(interaction) {
  const guildConfig = getGuildConfig(interaction.guildId);
  const djRoleId = guildConfig.music.djRoleId;

  if (!djRoleId) {
    return;
  }

  if (
    interaction.member.permissions.has(PermissionFlagsBits.ManageGuild) ||
    interaction.member.roles.cache.has(djRoleId)
  ) {
    return;
  }

  throw new Error("Bu komut icin DJ rolune ihtiyacin var.");
}

module.exports = {
  assertVoiceAccess,
  assertDjAccess,
};
