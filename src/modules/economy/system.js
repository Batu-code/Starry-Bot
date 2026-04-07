const { getGuildConfig, patchGuildConfig } = require("../../data/store");
const { updateProfile } = require("../progression/profiles");

function getBalance(guildId, userId) {
  return getGuildConfig(guildId).economy.balances[userId] || 0;
}

function setBalance(guildId, userId, amount) {
  const config = getGuildConfig(guildId);
  const balances = {
    ...config.economy.balances,
    [userId]: amount,
  };
  patchGuildConfig(guildId, {
    economy: {
      balances,
    },
  });
  updateProfile(guildId, userId, (profile) => ({
    ...profile,
    coins: amount,
  }));
  return amount;
}

function addBalance(guildId, userId, amount) {
  return setBalance(guildId, userId, getBalance(guildId, userId) + amount);
}

function getInventory(guildId, userId) {
  return getGuildConfig(guildId).economy.inventories[userId] || [];
}

function addInventoryItem(guildId, userId, itemId) {
  const config = getGuildConfig(guildId);
  const current = getInventory(guildId, userId);
  const inventories = {
    ...config.economy.inventories,
    [userId]: [...current, itemId],
  };
  patchGuildConfig(guildId, {
    economy: {
      inventories,
    },
  });
}

function claimDaily(guildId, userId) {
  const config = getGuildConfig(guildId);
  const last = config.economy.lastDailyClaims[userId] || 0;
  const cooldown = 24 * 60 * 60 * 1000;
  if (Date.now() - last < cooldown) {
    return null;
  }

  const reward = 250;
  const lastDailyClaims = {
    ...config.economy.lastDailyClaims,
    [userId]: Date.now(),
  };

  patchGuildConfig(guildId, {
    economy: {
      lastDailyClaims,
    },
  });

  addBalance(guildId, userId, reward);
  return reward;
}

function workShift(guildId, userId) {
  const reward = 80 + Math.floor(Math.random() * 121);
  addBalance(guildId, userId, reward);
  return reward;
}

function buyItem(guildId, userId, itemId) {
  const config = getGuildConfig(guildId);
  const item = config.economy.shop.find((entry) => entry.id === itemId);
  if (!item) {
    throw new Error("Urun bulunamadi.");
  }
  if (getBalance(guildId, userId) < item.price) {
    throw new Error("Yetersiz bakiye.");
  }
  setBalance(guildId, userId, getBalance(guildId, userId) - item.price);
  addInventoryItem(guildId, userId, itemId);
  return item;
}

function coinflip(guildId, userId, amount, guess) {
  if (getBalance(guildId, userId) < amount) {
    throw new Error("Yetersiz bakiye.");
  }
  const result = Math.random() > 0.5 ? "yazi" : "tura";
  const won = result === guess;
  const next = won ? getBalance(guildId, userId) + amount : getBalance(guildId, userId) - amount;
  setBalance(guildId, userId, next);
  return { result, won, amount };
}

function createClan(guildId, ownerId, name) {
  const config = getGuildConfig(guildId);
  const clans = { ...config.economy.clans };
  const id = `clan-${Date.now()}`;
  clans[id] = {
    id,
    name,
    ownerId,
    members: [ownerId],
    bank: 0,
  };
  patchGuildConfig(guildId, {
    economy: {
      clans,
    },
  });
  return clans[id];
}

function joinClan(guildId, userId, clanId) {
  const config = getGuildConfig(guildId);
  const clan = config.economy.clans[clanId];
  if (!clan) {
    throw new Error("Klan bulunamadi.");
  }
  if (!clan.members.includes(userId)) {
    clan.members.push(userId);
  }
  patchGuildConfig(guildId, {
    economy: {
      clans: {
        ...config.economy.clans,
        [clanId]: clan,
      },
    },
  });
  return clan;
}

module.exports = {
  getBalance,
  setBalance,
  addBalance,
  getInventory,
  claimDaily,
  workShift,
  buyItem,
  coinflip,
  createClan,
  joinClan,
};

