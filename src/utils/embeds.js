const { EmbedBuilder } = require("discord.js");
const { COLORS } = require("../constants");

function baseEmbed(color, title, description) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

function successEmbed(title, description) {
  return baseEmbed(COLORS.success, title, description);
}

function dangerEmbed(title, description) {
  return baseEmbed(COLORS.danger, title, description);
}

function infoEmbed(title, description) {
  return baseEmbed(COLORS.primary, title, description);
}

function warningEmbed(title, description) {
  return baseEmbed(COLORS.warning, title, description);
}

module.exports = {
  successEmbed,
  dangerEmbed,
  infoEmbed,
  warningEmbed,
};

