const { handleTempVoice } = require("../modules/community/tempVoice");

module.exports = {
  name: "voiceStateUpdate",
  async execute(client, oldState, newState) {
    await handleTempVoice(client, oldState, newState);
  },
};
