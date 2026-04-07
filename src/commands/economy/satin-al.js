const { SlashCommandBuilder } = require("discord.js");
const { buyItem } = require("../../modules/economy/system");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("satin-al")
    .setDescription("Marketten urun satin alir.")
    .addStringOption((option) => option.setName("urun").setDescription("Urun id").setRequired(true)),
  async execute(client, interaction) {
    const item = buyItem(interaction.guildId, interaction.user.id, interaction.options.getString("urun", true));
    await interaction.reply({ embeds: [successEmbed("Satin Alma Basarili", `${item.name} envanterine eklendi.`)], ephemeral: true });
  },
};

