const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
} = require("discord.js");
const { Player } = require("discord-player");

class BotClient extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Channel, Partials.Message, Partials.Reaction],
    });

    this.commands = new Collection();
    this.cooldowns = new Collection();
    this.runtime = {
      antiSpam: new Map(),
      antiNuke: new Map(),
      antiRaid: new Map(),
      tempVoiceOwners: new Map(),
      levelCooldowns: new Map(),
    };

    this.player = new Player(this);
    this.services = {
      dashboard: null,
    };
  }
}

module.exports = {
  BotClient,
};
