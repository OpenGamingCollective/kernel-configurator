const core = require("@actions/core");
const fs = require("fs");

function parseSetFile(filePath) {
  const entries = [];
  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    entries.push({ key: line.slice(0, idx), value: line.slice(idx + 1) });
  }
  return entries;
}

function parseUnsetFile(filePath) {
  const entries = [];
  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    entries.push(line);
  }
  return entries;
}

function applySet(configData, entries) {
  let modified = 0;
  let added = 0;
  let skipped = 0;
  const lines = configData.split("\n");

  for (const { key, value } of entries) {
    const setPrefix = `${key}=`;
    const unsetMarker = `# ${key} is not set`;
    let found = false;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(setPrefix)) {
        if (lines[i] === `${key}=${value}`) {
          core.info(`${key}=${value} already set, skipping`);
          skipped++;
        } else {
          lines[i] = `${key}=${value}`;
          modified++;
        }
        found = true;
        break;
      }
      if (lines[i] === unsetMarker) {
        lines[i] = `${key}=${value}`;
        found = true;
        modified++;
        break;
      }
    }

    if (!found) {
      lines.push(`${key}=${value}`);
      added++;
    }
  }

  return { configData: lines.join("\n"), modified, added, skipped };
}

function applyUnset(configData, entries) {
  let unsetCount = 0;
  const notFound = [];
  const lines = configData.split("\n");

  for (const key of entries) {
    const setPrefix = `${key}=`;
    const unsetMarker = `# ${key} is not set`;
    let found = false;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(setPrefix) || lines[i] === unsetMarker) {
        lines[i] = `# ${key} is not set`;
        found = true;
        unsetCount++;
        break;
      }
    }

    if (!found) {
      notFound.push(`${key} not found in config, skipping unset`);
    }
  }

  return { configData: lines.join("\n"), unsetCount, notFoundCount: notFound.length, notFound };
}

function main() {
  const configPath = core.getInput("config", { required: true });
  const setPaths = core.getMultilineInput("set", { required: true });
  const unsetPaths = core.getMultilineInput("unset").filter(p => p.length > 0);
  const outputPath = core.getInput("output") || configPath;

  if (!fs.existsSync(configPath)) {
    core.setFailed(`config file not found: ${configPath}`);
    return;
  }
  for (const p of setPaths) {
    if (!fs.existsSync(p)) {
      core.setFailed(`set file not found: ${p}`);
      return;
    }
  }
  for (const p of unsetPaths) {
    if (!fs.existsSync(p)) {
      core.setFailed(`unset file not found: ${p}`);
      return;
    }
  }

  let configData = fs.readFileSync(configPath, "utf8");

  const setEntries = [];
  for (const p of setPaths) {
    setEntries.push(...parseSetFile(p));
  }
  const setResult = applySet(configData, setEntries);
  configData = setResult.configData;

  let unsetCount = 0;
  let notFoundCount = 0;
  if (unsetPaths.length > 0) {
    const unsetEntries = [];
    for (const p of unsetPaths) {
      unsetEntries.push(...parseUnsetFile(p));
    }
    const unsetResult = applyUnset(configData, unsetEntries);
    configData = unsetResult.configData;
    unsetCount = unsetResult.unsetCount;
    notFoundCount = unsetResult.notFoundCount;
    for (const msg of unsetResult.notFound) {
      core.info(msg);
    }
  }

  fs.writeFileSync(outputPath, configData);
  core.info(
    `Set: ${setResult.modified}, Skipped: ${setResult.skipped}, Added: ${setResult.added}, Unset: ${unsetCount}, Not found: ${notFoundCount}`
  );
}

try {
  main();
} catch (error) {
  core.setFailed(error.message);
}
