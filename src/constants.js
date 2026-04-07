const {
  ChannelType,
  PermissionFlagsBits,
  Colors,
} = require("discord.js");

const DEFAULT_GUILD_CONFIG = {
  general: {
    prefix: "!",
    locale: "tr-TR",
  },
  security: {
    logChannelId: null,
    quarantineRoleId: null,
    jailRoleId: null,
    verifiedRoleId: null,
    unverifiedRoleId: null,
    trustedUserIds: [],
    safeRoleIds: [],
    antiRaid: {
      enabled: true,
      joinLimit: 6,
      windowMs: 15000,
      lockdownDurationMs: 15 * 60 * 1000,
      autoQuarantine: true,
    },
    antiSpam: {
      enabled: true,
      messageBurstLimit: 6,
      burstWindowMs: 8000,
      duplicateLimit: 3,
      mentionLimit: 5,
      timeoutMs: 10 * 60 * 1000,
      inviteBlockEnabled: true,
    },
    antiPhishing: {
      enabled: true,
      suspiciousDomains: [
        "dlscord",
        "d1scord",
        "discrod",
        "discordnitro",
        "nitro-drop",
        "steamcomminuty",
        "stearncommunity",
        "gift-nitro",
      ],
      shortenerDomains: [
        "bit.ly",
        "tinyurl.com",
        "cutt.ly",
        "goo.su",
        "shorturl.at",
      ],
      autoJail: true,
      deleteMessage: true,
    },
    scamShield: {
      enabled: true,
      deleteMessage: true,
      minScore: 4,
      autoJail: true,
      autoJailScore: 7,
    },
    antiAlt: {
      enabled: true,
      minAccountAgeMs: 7 * 24 * 60 * 60 * 1000,
      autoJail: false,
      autoQuarantine: true,
    },
    risk: {
      enabled: true,
      warnThreshold: 30,
      jailThreshold: 60,
      banThreshold: 90,
      scores: {},
    },
    antiNuke: {
      enabled: true,
      actionLimit: 3,
      windowMs: 20000,
      punishTimeoutMs: 28 * 24 * 60 * 60 * 1000,
      monitoredActions: [
        "channelDelete",
        "channelCreate",
        "roleDelete",
        "roleCreate",
        "webhookUpdate",
      ],
      rollbackEnabled: true,
    },
    moderatorAudit: {
      enabled: true,
      incidents: [],
      keepLast: 250,
    },
    snapshots: {
      enabled: true,
      keepLast: 5,
    },
    lockdown: {
      active: false,
      reason: null,
      startedAt: null,
    },
  },
  community: {
    logChannelId: null,
    welcomeChannelId: null,
    welcomeMessage:
      "Sunucuya hos geldin {user}. Kurallar kanalini okuyup topluluga katil!",
    autoRoleIds: [],
    verificationChannelId: null,
    ticket: {
      categoryId: null,
      panelChannelId: null,
      transcriptChannelId: null,
      supportRoleId: null,
      counter: 0,
    },
    leveling: {
      enabled: true,
      levelUpChannelId: null,
      cooldownMs: 60000,
    },
    autoResponses: {
      enabled: true,
      items: [
        {
          trigger: ".ol",
          exact: true,
          response: "https://tenor.com/view/roland-library-of-ruina-trunk-monkey-car-meme-trunk-monkey-roland-angela-gif-15533174039449494274",
        },
        {
          trigger: ".öl",
          exact: true,
          response: "https://tenor.com/view/roland-library-of-ruina-trunk-monkey-car-meme-trunk-monkey-roland-angela-gif-15533174039449494274",
        },
        {
          trigger: ".saril",
          exact: true,
          response: "https://tenor.com/view/cling-gif-10419099168557106015",
        },
        {
          trigger: ".sarıl",
          exact: true,
          response: "https://tenor.com/view/cling-gif-10419099168557106015",
        },
        {
          trigger: ".blubbatlat",
          exact: true,
          response: "https://tenor.com/view/kitten-cat-exploding-exploding-gif-1660358086204318095",
        },
      ],
    },
    selfRoles: [],
    tempVoice: {
      enabled: false,
      lobbyChannelId: null,
      categoryId: null,
    },
    stats: {
      enabled: false,
      categoryId: null,
      memberChannelId: null,
      botChannelId: null,
      onlineChannelId: null,
    },
    giveaways: {
      enabled: true,
      managerRoleId: null,
    },
    partnership: {
      enabled: false,
      categoryId: null,
      archiveCategoryId: null,
      panelChannelId: null,
      partnerChannelId: null,
      logChannelId: null,
      managerRoleId: null,
      minMemberCount: 50,
      cooldownMs: 7 * 24 * 60 * 60 * 1000,
      renewEveryDays: 30,
      renewalNoticeDays: 5,
      counter: 0,
      applicants: {},
      partners: [],
      blacklist: [],
    },
    events: {
      enabled: true,
      managerRoleId: null,
      items: {},
    },
    ai: {
      enabled: false,
      channelId: null,
      helperRoleId: null,
      autoReplyEnabled: false,
      historyLimit: 8,
      systemPrompt:
        "Sen bu Discord sunucusunun Turkce destek asistanisin. Net, kisa ve yardimci cevap ver. Guvenlik veya moderasyon konularinda riskli yonlendirme yapma.",
    },
  },
  music: {
    enabled: true,
    djRoleId: null,
    defaultVolume: 60,
    maxQueueSize: 100,
    autoplay: false,
    savedPlaylists: {},
    favoriteTracks: {},
    alwaysOn: false,
  },
  state: {
    raidModeUntil: null,
    inviteCache: {},
  },
  moderation: {
    cases: [],
    jailedMembers: {},
    timedActions: [],
    appealChannelId: null,
    appeals: [],
    escalation: {
      enabled: true,
      windowDays: 30,
      warnToTimeout: 3,
      timeoutDurationMs: 60 * 60 * 1000,
      timeoutToJail: 2,
      jailDurationMs: 24 * 60 * 60 * 1000,
      jailToBan: 2,
    },
  },
  progression: {
    profiles: {},
    achievements: {},
    dailyTasks: {},
    badges: {
      early: {
        name: "Erken Destekci",
        description: "Sunucuda erken donem aktif olan uye",
      },
      partner: {
        name: "Partner",
        description: "Onayli partner temsilcisi",
      },
      veteran: {
        name: "Veteran",
        description: "Uzun sure aktif kalan uye",
      },
    },
  },
  economy: {
    enabled: true,
    balances: {},
    inventories: {},
    lastDailyClaims: {},
    jobs: {},
    clans: {},
    shop: [
      {
        id: "vip_renk",
        name: "VIP Renk",
        price: 1500,
        description: "Ozel renk rolu icin talep acma hakki",
      },
      {
        id: "cekilis_bilet",
        name: "Cekilis Bileti",
        price: 500,
        description: "Etkinlik cekilislerinde ek hak",
      },
    ],
  },
  stats: {
    messages: {},
    voiceSeconds: {},
    invites: {},
  },
  automation: {
    announcementChannelId: null,
    scheduledAnnouncements: [],
  },
};

const COLORS = {
  primary: Colors.Blurple,
  success: Colors.Green,
  warning: Colors.Orange,
  danger: Colors.Red,
  muted: Colors.Grey,
};

const DANGEROUS_PERMISSIONS = [
  PermissionFlagsBits.Administrator,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.ManageGuild,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.ManageWebhooks,
  PermissionFlagsBits.ModerateMembers,
  PermissionFlagsBits.MentionEveryone,
];

const LOCKABLE_CHANNEL_TYPES = new Set([
  ChannelType.GuildText,
  ChannelType.GuildAnnouncement,
  ChannelType.GuildVoice,
  ChannelType.GuildForum,
  ChannelType.GuildStageVoice,
]);

module.exports = {
  DEFAULT_GUILD_CONFIG,
  COLORS,
  DANGEROUS_PERMISSIONS,
  LOCKABLE_CHANNEL_TYPES,
};
