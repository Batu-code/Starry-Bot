const { ChannelType, PermissionsBitField } = require("discord.js");
const { getGuildConfig } = require("../../data/store");

async function handleTempVoice(client, oldState, newState) {
  const member = newState.member || oldState.member;
  if (!member?.guild) {
    return;
  }

  const guildConfig = getGuildConfig(member.guild.id);
  const settings = guildConfig.community.tempVoice;

  if (!settings.enabled || !settings.lobbyChannelId || !settings.categoryId) {
    return;
  }

  if (newState.channelId === settings.lobbyChannelId) {
    const channel = await member.guild.channels.create({
      name: `${member.user.username} | Oda`,
      type: ChannelType.GuildVoice,
      parent: settings.categoryId,
      permissionOverwrites: [
        {
          id: member.guild.roles.everyone.id,
          allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ViewChannel],
        },
      ],
    });

    client.runtime.tempVoiceOwners.set(channel.id, member.id);
    await member.voice.setChannel(channel).catch(() => null);
  }

  const oldChannel = oldState.channel;
  if (
    oldChannel &&
    client.runtime.tempVoiceOwners.has(oldChannel.id) &&
    oldChannel.members.size === 0
  ) {
    client.runtime.tempVoiceOwners.delete(oldChannel.id);
    await oldChannel.delete("Temp voice bos kaldi").catch(() => null);
  }
}

module.exports = {
  handleTempVoice,
};

