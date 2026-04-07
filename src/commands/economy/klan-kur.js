const { SlashCommandBuilder } = require("discord.js");
const { createClan } = require("../../modules/economy/system");
const { successEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("klan-kur")
    .setDescription("Yeni bir klan kurarsin.")
    .addStringOption((option) => option.setName("isim").setDescription("Klan adi").setRequired(true)),
  async execute(client, interaction) {
    const clan = createClan(interaction.guildId, interaction.user.id, interaction.options.getString("isim", true));
    await interaction.reply({ embeds: [successEmbed("Klan Kuruldu", `${clan.name} klani olusturuldu. Kod: ${clan.id}`)], ephemeral: true });
  },
};

