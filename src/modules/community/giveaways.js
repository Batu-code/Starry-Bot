const { EmbedBuilder } = require("discord.js");
const { getRuntime, saveRuntime } = require("../../data/store");
const { sendLog } = require("../logging/sendLog");
const { COLORS } = require("../../constants");
const { formatDuration } = require("../../utils/time");

function listGiveaways() {
  return getRuntime("giveaways", []);
}

function saveGiveaways(items) {
  saveRuntime("giveaways", items);
}

function createGiveaway(payload) {
  const giveaways = listGiveaways();
  const entry = {
    id: `${Date.now()}`,
    createdAt: Date.now(),
    ended: false,
    entries: [],
    ...payload,
  };

  giveaways.push(entry);
  saveGiveaways(giveaways);
  return entry;
}

function updateGiveaway(id, updater) {
  const giveaways = listGiveaways();
  const index = giveaways.findIndex((item) => item.id === id);
  if (index === -1) {
    return null;
  }

  giveaways[index] = updater(giveaways[index]);
  saveGiveaways(giveaways);
  return giveaways[index];
}

async function publishGiveaway(channel, giveaway) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.primary)
    .setTitle("Cekilis Basladi")
    .setDescription(
      `Odul: **${giveaway.prize}**\nKazanan sayisi: **${giveaway.winnerCount}**\nSure: **${formatDuration(giveaway.endsAt - Date.now())}**\nKatilmak icin mesaja tepki birak.`,
    )
    .setTimestamp(new Date(giveaway.endsAt));

  const message = await channel.send({ embeds: [embed] });
  await message.react("🎉").catch(() => null);

  return updateGiveaway(giveaway.id, (current) => ({
    ...current,
    messageId: message.id,
    channelId: channel.id,
    guildId: channel.guild.id,
  }));
}

async function resolveGiveaway(client, giveaway) {
  const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
  if (!channel?.isTextBased()) {
    return;
  }

  const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
  if (!message) {
    return;
  }

  const reaction = message.reactions.cache.get("🎉");
  const users = reaction ? await reaction.users.fetch().catch(() => null) : null;
  const participants = users
    ? [...users.values()].filter((user) => !user.bot).map((user) => user.id)
    : [];

  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  const winners = shuffled.slice(0, giveaway.winnerCount);

  await channel.send({
    content: winners.length
      ? `Cekilis bitti. Kazananlar: ${winners.map((id) => `<@${id}>`).join(", ")} | Odul: **${giveaway.prize}**`
      : `Cekilis bitti ama gecerli katilimci cikmadi. Odul: **${giveaway.prize}**`,
  }).catch(() => null);

  await sendLog(channel.guild, {
    color: COLORS.success,
    title: "Cekilis Sonuclandi",
    description: `Odul: ${giveaway.prize}`,
    fields: [
      {
        name: "Kazananlar",
        value: winners.length ? winners.map((id) => `<@${id}>`).join(", ") : "Yok",
        inline: false,
      },
    ],
  });

  updateGiveaway(giveaway.id, (current) => ({
    ...current,
    ended: true,
    winners,
  }));
}

function startGiveawayLoop(client) {
  setInterval(async () => {
    const giveaways = listGiveaways();
    const due = giveaways.filter((item) => !item.ended && item.endsAt <= Date.now());

    for (const giveaway of due) {
      await resolveGiveaway(client, giveaway);
    }
  }, 15000);
}

module.exports = {
  createGiveaway,
  publishGiveaway,
  startGiveawayLoop,
};

