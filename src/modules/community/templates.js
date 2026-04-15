function buildTemplateContext(input = {}) {
  return {
    user: input.user || "",
    userTag: input.userTag || "",
    username: input.username || "",
    guild: input.guild || "",
    memberCount: String(input.memberCount || 0),
    boostCount: String(input.boostCount || 0),
    inviter: input.inviter || "",
  };
}

function applyTemplate(template, context) {
  const safeTemplate = template || "";
  return safeTemplate.replace(/\{(\w+)\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(context, key)) {
      return String(context[key]);
    }

    return match;
  });
}

module.exports = {
  buildTemplateContext,
  applyTemplate,
};
