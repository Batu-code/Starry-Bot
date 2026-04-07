const config = require("../../config");
const { getGuildConfig } = require("../../data/store");

function isAiAvailable() {
  return Boolean(config.ai.enabled && config.ai.apiKey);
}

async function generateSupportAnswer(guildId, question, context = {}) {
  if (!isAiAvailable()) {
    throw new Error("AI sistemi ortam degiskenlerinde aktif degil.");
  }

  const guildConfig = getGuildConfig(guildId);
  const systemPrompt = guildConfig.community.ai.systemPrompt;
  const response = await fetch(`${config.ai.baseUrl.replace(/\/$/, "")}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.ai.apiKey}`,
    },
    body: JSON.stringify({
      model: config.ai.model,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: systemPrompt }],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                context.userTag ? `Kullanici: ${context.userTag}` : null,
                context.channelName ? `Kanal: ${context.channelName}` : null,
                `Soru: ${question}`,
              ]
                .filter(Boolean)
                .join("\n"),
            },
          ],
        },
      ],
      max_output_tokens: 500,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI istegi basarisiz: ${response.status} ${text}`);
  }

  const data = await response.json();
  const text =
    data.output_text ||
    data.output?.flatMap((item) => item.content || []).find((item) => item.text)?.text ||
    "Yanit olusturulamadi.";

  return text;
}

module.exports = {
  isAiAvailable,
  generateSupportAnswer,
};

