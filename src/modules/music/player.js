const { QueryType } = require("discord-player");
const { DefaultExtractors } = require("@discord-player/extractor");
const { getGuildConfig } = require("../../data/store");
const { sendLog } = require("../logging/sendLog");
const { COLORS } = require("../../constants");

async function setupPlayer(client) {
  await client.player.extractors.loadMulti(DefaultExtractors);

  client.player.events.on("playerStart", async (queue, track) => {
    queue.metadata.lastTrackUrl = track.url;
    queue.metadata.lastTrackTitle = track.title;
    await queue.metadata.channel.send({
      content: `Calmaya basladi: **${track.title}**`,
    }).catch(() => null);
  });

  client.player.events.on("audioTrackAdd", async (queue, track) => {
    await queue.metadata.channel.send({
      content: `Kuyruga eklendi: **${track.title}**`,
    }).catch(() => null);
  });

  client.player.events.on("error", async (queue, error) => {
    if (!queue?.metadata?.guild) {
      return;
    }

    await sendLog(queue.metadata.guild, {
      color: COLORS.danger,
      title: "Muzik Hatasi",
      description: error.message,
    });
  });

  client.player.events.on("emptyQueue", async (queue) => {
    const guild = queue.metadata.guild;
    const guildConfig = getGuildConfig(guild.id);
    if (guildConfig.music.alwaysOn) {
      await queue.metadata.channel.send({
        content: "24/7 muzik modu acik. Bot ses kanalinda beklemeye devam ediyor.",
      }).catch(() => null);
      return;
    }

    if (!guildConfig.music.autoplay || !queue.metadata.lastTrackUrl) {
      return;
    }

    const result = await queue.metadata.guild.client.player.search(queue.metadata.lastTrackUrl, {
      requestedBy: queue.metadata.requestedBy,
      searchEngine: QueryType.AUTO,
    }).catch(() => null);

    if (!result?.tracks?.length) {
      return;
    }

    queue.addTrack(result.tracks[0]);
    await queue.node.play().catch(() => null);
  });
}

async function ensureQueue(interaction) {
  const guildConfig = getGuildConfig(interaction.guildId);
  if (!guildConfig.music.enabled) {
    throw new Error("Muzik sistemi kapali.");
  }

  const voiceChannel = interaction.member.voice.channel;
  if (!voiceChannel) {
    throw new Error("Once bir ses kanalina girmen gerekiyor.");
  }

  const queue = await interaction.client.player.nodes.create(interaction.guild, {
    metadata: {
      channel: interaction.channel,
      guild: interaction.guild,
      requestedBy: interaction.user,
    },
    leaveOnEmpty: !guildConfig.music.alwaysOn,
    leaveOnEnd: !guildConfig.music.alwaysOn,
    leaveOnStop: !guildConfig.music.alwaysOn,
    selfDeaf: true,
    volume: guildConfig.music.defaultVolume,
  });

  if (!queue.connection) {
    await queue.connect(voiceChannel);
  }

  return queue;
}

async function searchTrack(player, query, requestedBy) {
  const result = await player.search(query, {
    requestedBy,
    searchEngine: QueryType.AUTO,
  });

  if (!result.hasTracks()) {
    throw new Error("Sarki bulunamadi.");
  }

  return result;
}

function enqueueTracks(queue, tracks) {
  for (const track of tracks) {
    queue.addTrack(track);
  }
}

module.exports = {
  setupPlayer,
  ensureQueue,
  searchTrack,
  enqueueTracks,
};
