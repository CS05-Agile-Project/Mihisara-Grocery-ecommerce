import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const WINDOWS_POWERSHELL = "powershell.exe";

function normalizeJsonArray(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

async function resolveDnsWithPowerShell(script, env) {
  if (process.platform !== "win32") {
    return [];
  }

  const { stdout } = await execFileAsync(
    WINDOWS_POWERSHELL,
    ["-NoProfile", "-Command", script],
    {
      env: {
        ...process.env,
        ...env,
      },
      windowsHide: true,
    },
  );

  const payload = stdout.trim();

  if (!payload) {
    return [];
  }

  return normalizeJsonArray(JSON.parse(payload));
}

async function resolveSrvRecords(clusterHost) {
  const script = [
    '$hostName = $env:MONGO_CLUSTER_HOST',
    '$records = Resolve-DnsName -Type SRV ("_mongodb._tcp." + $hostName) -ErrorAction Stop | Select-Object NameTarget, Port',
    'if ($records) { $records | ConvertTo-Json -Compress }',
  ].join("; ");

  return resolveDnsWithPowerShell(script, {
    MONGO_CLUSTER_HOST: clusterHost,
  });
}

async function resolveTxtRecords(clusterHost) {
  const script = [
    '$hostName = $env:MONGO_CLUSTER_HOST',
    '$records = Resolve-DnsName -Type TXT $hostName -ErrorAction Stop | Select-Object -ExpandProperty Strings',
    'if ($records) { $records | ConvertTo-Json -Compress }',
  ].join("; ");

  return resolveDnsWithPowerShell(script, {
    MONGO_CLUSTER_HOST: clusterHost,
  });
}

function shouldRetryWithDirectUri(error, mongoUrl) {
  return Boolean(
    process.platform === "win32" &&
      mongoUrl?.startsWith("mongodb+srv://") &&
      error?.code === "ECONNREFUSED" &&
      /querySrv/i.test(error.message || ""),
  );
}

function mergeQueryParameters(originalSearchParams, txtRecords) {
  const merged = new URLSearchParams(originalSearchParams);

  for (const record of txtRecords) {
    const params = new URLSearchParams(String(record));

    for (const [key, value] of params.entries()) {
      if (!merged.has(key)) {
        merged.set(key, value);
      }
    }
  }

  if (!merged.has("tls") && !merged.has("ssl")) {
    merged.set("tls", "true");
  }

  return merged.toString();
}

export async function buildDirectMongoUrl(mongoUrl) {
  if (process.platform !== "win32" || !mongoUrl?.startsWith("mongodb+srv://")) {
    return null;
  }

  const parsedUrl = new URL(mongoUrl);
  const srvRecords = await resolveSrvRecords(parsedUrl.hostname);

  if (!srvRecords.length) {
    return null;
  }

  const txtRecords = await resolveTxtRecords(parsedUrl.hostname);
  const authMatch = mongoUrl.match(/^mongodb\+srv:\/\/([^@]+)@/);
  const authPart = authMatch ? `${authMatch[1]}@` : "";
  const hosts = srvRecords
    .map(({ NameTarget, Port }) => `${String(NameTarget).replace(/\.$/, "")}:${Port || 27017}`)
    .join(",");
  const pathname = parsedUrl.pathname && parsedUrl.pathname !== "/" ? parsedUrl.pathname : "/test";
  const queryString = mergeQueryParameters(parsedUrl.searchParams, txtRecords);

  return `mongodb://${authPart}${hosts}${pathname}?${queryString}`;
}

export async function connectToMongo(mongoose, mongoUrl, options = {}) {
  if (!mongoUrl) {
    throw new Error("MONGODB_URL is not set. Add it to backend/.env.");
  }

  try {
    await mongoose.connect(mongoUrl, options);
    return { usedDirectFallback: false };
  } catch (error) {
    if (!shouldRetryWithDirectUri(error, mongoUrl)) {
      throw error;
    }

    const directMongoUrl = await buildDirectMongoUrl(mongoUrl);

    if (!directMongoUrl) {
      throw error;
    }

    await mongoose.connect(directMongoUrl, options);
    return { usedDirectFallback: true };
  }
}
