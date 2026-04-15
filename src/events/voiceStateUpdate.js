const { handleTempVoice } = require("../modules/community/tempVoice");
const { handleVoiceTracking } = require("../modules/progression/voiceTracking");

module.exports = {
  name: "voiceStateUpdate",
  async execute(client, oldState, newState) {
    await handleVoiceTracking(client, oldState, newState);
    await handleTempVoice(client, oldState, newState);
  },
};
