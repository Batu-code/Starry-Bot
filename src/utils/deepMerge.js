function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(target, source) {
  const output = Array.isArray(target) ? [...target] : { ...target };

  if (!isPlainObject(source)) {
    return output;
  }

  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      output[key] = [...value];
      continue;
    }

    if (isPlainObject(value)) {
      output[key] = deepMerge(output[key] || {}, value);
      continue;
    }

    output[key] = value;
  }

  return output;
}

module.exports = {
  deepMerge,
};

