const express = require("express");
const config = require("../config");
const { getGuildConfig, patchGuildConfig } = require("../data/store");
const { createBackup, listBackups } = require("../modules/security/backups");
const { scheduleAnnouncement } = require("../modules/community/announcements");
const { buildProdStatus } = require("../modules/system/runtimeHealth");
const logger = require("../utils/logger");

function authMiddleware(req, res, next) {
  const token = req.headers["x-dashboard-token"] || req.query.token || req.body?.token;
  if (token !== config.dashboard.token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

function summarizeGuild(client, guild) {
  const cfg = getGuildConfig(guild.id);
  return {
    id: guild.id,
    name: guild.name,
    members: guild.memberCount,
    features: {
      antiRaid: cfg.security.antiRaid.enabled,
      antiSpam: cfg.security.antiSpam.enabled,
      ai: cfg.community.ai.enabled,
      partnership: cfg.community.partnership.enabled,
      applications: cfg.community.applications.enabled,
      feedback: cfg.community.feedback.enabled,
      customCommands: (cfg.community.customCommands || []).length,
      weeklyReports: cfg.automation.weeklyReports.enabled,
    },
  };
}

function renderHome(client) {
  const guildCards = client.guilds.cache
    .map((guild) => summarizeGuild(client, guild))
    .map(
      (guild) => `
      <section class="card">
        <h2>${guild.name}</h2>
        <p>Uye: ${guild.members}</p>
        <p>Anti-Raid: ${guild.features.antiRaid ? "Acik" : "Kapali"} | AI: ${guild.features.ai ? "Acik" : "Kapali"}</p>
        <p>Partnerlik: ${guild.features.partnership ? "Acik" : "Kapali"}</p>
        <p>Basvuru: ${guild.features.applications ? "Acik" : "Kapali"} | Geri Bildirim: ${guild.features.feedback ? "Acik" : "Kapali"} | Ozel Komut: ${guild.features.customCommands}</p>
        <p>Haftalik Rapor: ${guild.features.weeklyReports ? "Acik" : "Kapali"}</p>
        <p><a href="/guilds/${guild.id}?token=${encodeURIComponent(config.dashboard.token)}">Detay sayfasi</a></p>
        <p>API: <code>/api/guilds/${guild.id}/overview?token=...</code></p>
      </section>`,
    )
    .join("\n");

  return `<!doctype html>
  <html lang="tr">
    <head>
      <meta charset="utf-8" />
      <title>Bocchi Panel</title>
      <style>
        body { font-family: Segoe UI, sans-serif; background: linear-gradient(135deg, #101b2d, #1e385a); color: #eef3f8; margin: 0; padding: 32px; }
        h1 { margin-top: 0; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
        .card { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 18px; padding: 18px; backdrop-filter: blur(8px); }
        code { color: #ffe08a; }
      </style>
    </head>
    <body>
      <h1>Bocchi Dashboard</h1>
      <p>Bu panel token korumali API ile birlikte gelir. Gercek kullanimda reverse proxy ve HTTPS onerilir.</p>
      <div class="grid">${guildCards}</div>
    </body>
  </html>`;
}

function getGuildDetail(client, guildId) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    return null;
  }

  const cfg = getGuildConfig(guild.id);
  const moderationCases = (cfg.moderation.cases || []).slice(-8).reverse();

  return {
    guild,
    cfg,
    moderationCases,
    partners: (cfg.community.partnership.partners || []).slice(-5).reverse(),
    backups: listBackups().filter((entry) => entry.guildId === guild.id).slice(0, 5),
    tickets: Object.values(cfg.community.ticket.records || {}).slice(-5).reverse(),
    applications: Object.values(cfg.community.applications.records || {}).slice(-5).reverse(),
    feedbackItems: Object.values(cfg.community.feedback.items || {}).slice(-5).reverse(),
    topChat: Object.entries(cfg.stats.messages || {})
      .sort((a, b) => (b[1].xp || 0) - (a[1].xp || 0))
      .slice(0, 5),
  };
}

function renderGuildDetail(client, guildId) {
  const detail = getGuildDetail(client, guildId);
  if (!detail) {
    return null;
  }

  const { guild, cfg, moderationCases, partners, backups, tickets, applications, feedbackItems, topChat } = detail;
  const prod = buildProdStatus();
  return `<!doctype html>
  <html lang="tr">
    <head>
      <meta charset="utf-8" />
      <title>${guild.name} | Dashboard</title>
      <style>
        body { font-family: Segoe UI, sans-serif; background: radial-gradient(circle at top, #16314c, #0d1828 60%); color: #eef3f8; margin: 0; padding: 28px; }
        a { color: #ffe08a; }
        .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:16px; }
        .card { background: rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); border-radius:18px; padding:18px; }
        .mono { font-family: Consolas, monospace; }
      </style>
    </head>
    <body>
      <p><a href="/">Ana sayfa</a></p>
      <h1>${guild.name}</h1>
      <div class="grid">
        <section class="card">
          <h2>Guvenlik</h2>
          <p>Anti-Raid: ${cfg.security.antiRaid.enabled ? "Acik" : "Kapali"}</p>
          <p>Anti-Spam: ${cfg.security.antiSpam.enabled ? "Acik" : "Kapali"}</p>
          <p>Anti-Alt: ${cfg.security.antiAlt.enabled ? "Acik" : "Kapali"}</p>
          <p>AI: ${cfg.community.ai.enabled ? "Acik" : "Kapali"}</p>
        </section>
        <section class="card">
          <h2>Prod</h2>
          <p>Durum: ${prod.status}</p>
          <p>Saglikli: ${prod.healthy ? "Evet" : "Hayir"}</p>
          <p>PID: ${prod.pid || "-"}</p>
          <p>Bellek: ${prod.memoryMb} MB</p>
        </section>
        <section class="card">
          <h2>Son Moderasyon</h2>
          <div>${moderationCases.length ? moderationCases.map((entry) => `<p>#${entry.id} ${entry.type} - ${entry.reason}</p>`).join("") : "<p>Kayit yok</p>"}</div>
        </section>
        <section class="card">
          <h2>Partnerlik</h2>
          <div>${partners.length ? partners.map((entry) => `<p>${entry.serverName} - ${entry.memberCount} uye</p>`).join("") : "<p>Partner yok</p>"}</div>
        </section>
        <section class="card">
          <h2>Ticket v2</h2>
          <div>${tickets.length ? tickets.map((entry) => `<p>${entry.typeLabel} - ${entry.status} - ${entry.subject}</p>`).join("") : "<p>Ticket kaydi yok</p>"}</div>
        </section>
        <section class="card">
          <h2>Basvurular</h2>
          <div>${applications.length ? applications.map((entry) => `<p>${entry.typeLabel} - ${entry.status}</p>`).join("") : "<p>Basvuru yok</p>"}</div>
        </section>
        <section class="card">
          <h2>Geri Bildirim</h2>
          <div>${feedbackItems.length ? feedbackItems.map((entry) => `<p>${entry.kind} - ${entry.status} - ${entry.title}</p>`).join("") : "<p>Kayit yok</p>"}</div>
        </section>
        <section class="card">
          <h2>Haftalik Rapor</h2>
          <p>Kanal: ${cfg.automation.weeklyReports.channelId ? cfg.automation.weeklyReports.channelId : "Kapali"}</p>
          <p>Gun: ${cfg.automation.weeklyReports.dayOfWeek}</p>
          <p>Saat: ${String(cfg.automation.weeklyReports.hour).padStart(2, "0")}:${String(cfg.automation.weeklyReports.minute).padStart(2, "0")}</p>
        </section>
        <section class="card">
          <h2>Rank Liderleri</h2>
          <div>${topChat.length ? topChat.map(([id, entry]) => `<p class="mono">${id} - ${entry.level || 0}lv / ${entry.xp || 0}xp</p>`).join("") : "<p>Veri yok</p>"}</div>
        </section>
        <section class="card">
          <h2>Yedekler</h2>
          <div>${backups.length ? backups.map((entry) => `<p class="mono">${entry.id}</p>`).join("") : "<p>Yedek yok</p>"}</div>
        </section>
      </div>
    </body>
  </html>`;
}

function startDashboard(client) {
  if (!config.dashboard.enabled) {
    return null;
  }

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.get("/", (req, res) => {
    res.type("html").send(renderHome(client));
  });

  app.get("/health", (req, res) => {
    res.json({
      ok: true,
      guilds: client.guilds.cache.size,
      dashboard: true,
      prod: buildProdStatus(),
    });
  });

  app.get("/guilds/:guildId", (req, res) => {
    const token = req.query.token;
    if (token !== config.dashboard.token) {
      res.status(401).type("html").send("<h1>Unauthorized</h1>");
      return;
    }
    const html = renderGuildDetail(client, req.params.guildId);
    if (!html) {
      res.status(404).type("html").send("<h1>Guild not found</h1>");
      return;
    }
    res.type("html").send(html);
  });

  app.use("/api", authMiddleware);

  app.get("/api/guilds", (req, res) => {
    res.json(client.guilds.cache.map((guild) => summarizeGuild(client, guild)));
  });

  app.get("/api/runtime", (req, res) => {
    res.json(buildProdStatus());
  });

  app.get("/api/guilds/:guildId/overview", (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) {
      res.status(404).json({ error: "Guild not found" });
      return;
    }
    const configData = getGuildConfig(guild.id);
    res.json({
      guild: summarizeGuild(client, guild),
      config: configData,
      backups: listBackups().filter((entry) => entry.guildId === guild.id),
      prod: buildProdStatus(),
    });
  });

  app.get("/api/guilds/:guildId/moderation", (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) {
      res.status(404).json({ error: "Guild not found" });
      return;
    }
    const cfg = getGuildConfig(guild.id);
    res.json({
      cases: cfg.moderation.cases || [],
      appeals: cfg.moderation.appeals || [],
      timedActions: cfg.moderation.timedActions || [],
    });
  });

  app.get("/api/guilds/:guildId/partnerships", (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) {
      res.status(404).json({ error: "Guild not found" });
      return;
    }
    const cfg = getGuildConfig(guild.id);
    res.json({
      partners: cfg.community.partnership.partners || [],
      applicants: cfg.community.partnership.applicants || {},
      blacklist: cfg.community.partnership.blacklist || [],
    });
  });

  app.get("/api/guilds/:guildId/community", (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) {
      res.status(404).json({ error: "Guild not found" });
      return;
    }
    const cfg = getGuildConfig(guild.id);
    res.json({
      ticket: cfg.community.ticket,
      applications: cfg.community.applications,
      feedback: cfg.community.feedback,
      customCommands: cfg.community.customCommands || [],
    });
  });

  app.get("/api/guilds/:guildId/progression", (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) {
      res.status(404).json({ error: "Guild not found" });
      return;
    }
    const cfg = getGuildConfig(guild.id);
    res.json({
      messages: cfg.stats.messages || {},
      voiceSeconds: cfg.stats.voiceSeconds || {},
      partnerScores: cfg.stats.partnerScores || {},
      staff: cfg.stats.staff || {},
    });
  });

  app.get("/api/guilds/:guildId/ai", (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) {
      res.status(404).json({ error: "Guild not found" });
      return;
    }
    const cfg = getGuildConfig(guild.id);
    res.json({
      ai: cfg.community.ai,
    });
  });

  app.post("/api/guilds/:guildId/security/toggle", (req, res) => {
    const { moduleName, enabled } = req.body;
    const allowed = new Set(["antiRaid", "antiSpam", "antiAlt", "antiPhishing", "risk"]);
    if (!allowed.has(moduleName)) {
      res.status(400).json({ error: "Invalid module" });
      return;
    }
    patchGuildConfig(req.params.guildId, {
      security: {
        [moduleName]: {
          enabled: Boolean(enabled),
        },
      },
    });
    res.json({ ok: true });
  });

  app.post("/api/guilds/:guildId/backups", async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) {
      res.status(404).json({ error: "Guild not found" });
      return;
    }
    const backup = await createBackup(guild);
    res.json({ ok: true, backup });
  });

  app.post("/api/guilds/:guildId/announcements", (req, res) => {
    const { channelId, message, delayMs } = req.body;
    const announcement = scheduleAnnouncement(req.params.guildId, {
      id: `${Date.now()}`,
      channelId,
      message,
      sendAt: Date.now() + Number(delayMs || 0),
    });
    res.json({ ok: true, announcement });
  });

  app.post("/api/guilds/:guildId/ai", (req, res) => {
    const { enabled, autoReplyEnabled, channelId } = req.body;
    patchGuildConfig(req.params.guildId, {
      community: {
        ai: {
          enabled: Boolean(enabled),
          autoReplyEnabled: Boolean(autoReplyEnabled),
          channelId: channelId || null,
        },
      },
    });
    res.json({ ok: true });
  });

  const server = app.listen(config.dashboard.port, config.dashboard.host, () => {
    logger.info("Dashboard started", {
      host: config.dashboard.host,
      port: config.dashboard.port,
    });
  });

  return server;
}

module.exports = {
  startDashboard,
};
