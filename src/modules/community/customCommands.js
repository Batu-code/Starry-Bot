const { getGuildConfig, patchGuildConfig } = require("../../data/store");

function listCustomCommands(guildId) {
  return getGuildConfig(guildId).community.customCommands || [];
}

function addCustomCommand(guildId, command) {
  const items = listCustomCommands(guildId);
  const normalizedTrigger = command.trigger.toLowerCase().trim();
  const next = items.filter((item) => item.trigger !== normalizedTrigger);
  next.push({
    trigger: normalizedTrigger,
    response: command.response,
    exact: command.exact !== false,
    createdAt: Date.now(),
  });

  patchGuildConfig(guildId, {
    community: {
      customCommands: next,
    },
  });
}

function removeCustomCommand(guildId, trigger) {
  const items = listCustomCommands(guildId);
  const normalizedTrigger = trigger.toLowerCase().trim();
  const next = items.filter((item) => item.trigger !== normalizedTrigger);

  patchGuildConfig(guildId, {
    community: {
      customCommands: next,
    },
  });

  return next.length !== items.length;
}

async function handleCustomCommand(message) {
  const guildConfig = getGuildConfig(message.guild.id);
  const acceptedPrefixes = [".", guildConfig.general.prefix || "!"];
  const prefix = acceptedPrefixes.find((item) => message.content.startsWith(item));
  if (!prefix) {
    return false;
  }

  const body = message.content.slice(prefix.length).trim();
  if (!body) {
    return false;
  }

  const commands = listCustomCommands(message.guild.id);
  const match = commands.find((item) => {
    if (item.exact) {
      return body.toLowerCase() === item.trigger;
    }

    return body.toLowerCase().startsWith(item.trigger);
  });

  if (!match) {
    return false;
  }

  await message.reply({ content: match.response.slice(0, 1900) }).catch(() => null);
  return true;
}

module.exports = {
  listCustomCommands,
  addCustomCommand,
  removeCustomCommand,
  handleCustomCommand,
};
