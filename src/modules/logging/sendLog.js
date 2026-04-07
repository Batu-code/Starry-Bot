const { EmbedBuilder } = require("discord.js");
const { getGuildConfig } = require("../../data/store");
const { COLORS } = require("../../constants");

async function sendLog(guild, options) {
  const guildConfig = getGuildConfig(guild.id);
  const logChannelId =
    options.channelId ||
    guildConfig.security.logChannelId ||
    guildConfig.community.logChannelId;

  if (!logChannelId) {
    return;
  }

  const channel = await guild.channels.fetch(logChannelId).catch(() => null);
  if (!channel?.isTextBased()) {
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(options.color || COLORS.primary)
    .setTitle(options.title || "Bot Log")
    .setDescription(options.description || "Bir olay kaydedildi.")
    .setTimestamp();

  if (options.fields?.length) {
    embed.addFields(options.fields);
  }

  if (options.footer) {
    embed.setFooter({ text: options.footer });
  }

  await channel.send({ embeds: [embed] }).catch(() => null);
}

module.exports = {
  sendLog,
};

