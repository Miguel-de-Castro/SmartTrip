import path from "path";
import fs from "fs/promises";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Your real trip lives in tripState.local.json (gitignored) and always wins.
// tripState.json is the versioned demo data (James & Bond). It is only read
// when no local file exists yet, and it is never written to.
const localDataFilePath = path.resolve(__dirname, "data", "tripState.local.json");
const seedDataFilePath = path.resolve(__dirname, "data", "tripState.json");

const fileExists = async (filePath: string) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const toApiDate = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getDate()}`.padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
};

const getHistoricalRate = async (currencyCode: string, paymentDate: string) => {
  if (currencyCode.toUpperCase() === "BRL") {
    return { rate: 1, quoteDate: paymentDate };
  }

  const upperCurrency = currencyCode.toUpperCase();
  const baseDate = new Date(paymentDate);
  if (Number.isNaN(baseDate.getTime())) {
    throw new Error("Invalid paymentDate");
  }

  for (let backDays = 0; backDays <= 7; backDays += 1) {
    const candidateDate = new Date(baseDate);
    candidateDate.setDate(baseDate.getDate() - backDays);
    const apiDate = toApiDate(candidateDate);
    const pair = `${upperCurrency}-BRL`;
    const url = `https://economia.awesomeapi.com.br/json/daily/${pair}/1?start_date=${apiDate}&end_date=${apiDate}`;

    const response = await fetch(url);
    if (!response.ok) continue;

    const payload = await response.json();
    const quote = Array.isArray(payload) ? payload[0] : undefined;
    const rate = Number.parseFloat(quote?.ask ?? "");

    if (Number.isFinite(rate) && rate > 0) {
      return {
        rate,
        quoteDate: quote?.create_date || candidateDate.toISOString(),
      };
    }
  }

  throw new Error("No historical quote found");
};

const MAX_BODY_BYTES = 5 * 1024 * 1024;

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const readRequestBody = async (req: any) => {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let tooLarge = false;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        // Keep draining (don't destroy the socket) so the client gets a clean 413.
        tooLarge = true;
        chunks.length = 0;
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (tooLarge) reject(new HttpError(413, "Request body too large"));
      else resolve(Buffer.concat(chunks).toString("utf-8"));
    });
    req.on("error", reject);
  });
};

// The data API only answers this computer: requests whose Host or Origin isn't
// localhost are refused, so other websites open in the browser (or DNS-rebinding
// tricks) can't read or overwrite the trip.
const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
const isLocalRequest = (req: any) => {
  const host = String(req.headers.host ?? "").replace(/:\d+$/, "");
  if (!LOOPBACK.has(host)) return false;
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return LOOPBACK.has(new URL(origin).hostname);
  } catch {
    return false;
  }
};

const isArrayOfObjects = (value: unknown) =>
  Array.isArray(value) &&
  value.every((item) => typeof item === "object" && item !== null);

/** Shape check before anything is written to disk. */
const isTripState = (value: any) =>
  typeof value === "object" &&
  value !== null &&
  isArrayOfObjects(value.users) &&
  isArrayOfObjects(value.cities) &&
  isArrayOfObjects(value.expenses) &&
  (value.categories === undefined || isArrayOfObjects(value.categories)) &&
  typeof value.currentCurrency === "string" &&
  typeof value.totalBudgetBRL === "number";

const tripStateApiPlugin = () => ({
  name: "trip-state-api",
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      const requestUrl = new URL(req.url || "", "http://localhost");

      if (
        !requestUrl.pathname.startsWith("/api/trip-state") &&
        !requestUrl.pathname.startsWith("/api/exchange-rate")
      ) {
        return next();
      }

      res.setHeader("Content-Type", "application/json; charset=utf-8");

      if (!isLocalRequest(req)) {
        res.statusCode = 403;
        res.end(
          JSON.stringify({ error: "Only requests from this computer are allowed" }),
        );
        return;
      }

      try {
        if (requestUrl.pathname.startsWith("/api/exchange-rate")) {
          if (req.method !== "GET") {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: "Method not allowed" }));
            return;
          }

          const currencyCode =
            requestUrl.searchParams.get("currencyCode") || "";
          const paymentDate = requestUrl.searchParams.get("paymentDate") || "";

          if (
            !/^[A-Za-z]{3}$/.test(currencyCode) ||
            !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)
          ) {
            res.statusCode = 400;
            res.end(
              JSON.stringify({
                error:
                  "currencyCode (3 letters) and paymentDate (YYYY-MM-DD) are required",
              }),
            );
            return;
          }

          const result = await getHistoricalRate(currencyCode, paymentDate);
          res.statusCode = 200;
          res.end(JSON.stringify(result));
          return;
        }

        if (req.method === "GET") {
          const source = (await fileExists(localDataFilePath))
            ? localDataFilePath
            : seedDataFilePath;
          const raw = await fs.readFile(source, "utf-8");
          res.statusCode = 200;
          res.end(raw);
          return;
        }

        if (req.method === "PUT") {
          const contentType = String(req.headers["content-type"] ?? "");
          if (!contentType.includes("application/json")) {
            throw new HttpError(415, "Content-Type must be application/json");
          }
          const body = await readRequestBody(req);
          const parsed = JSON.parse(body);
          if (!isTripState(parsed)) {
            throw new HttpError(400, "Body is not a valid trip state");
          }
          await fs.writeFile(
            localDataFilePath,
            `${JSON.stringify(parsed, null, 2)}\n`,
            "utf-8",
          );
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        res.statusCode = 405;
        res.end(JSON.stringify({ error: "Method not allowed" }));
      } catch (error) {
        if (error instanceof HttpError || error instanceof SyntaxError) {
          res.statusCode = error instanceof HttpError ? error.status : 400;
          res.end(JSON.stringify({ error: error.message }));
          return;
        }
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Failed to process API request" }));
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  // The placeholder from .env.example counts as "no key": smart input stays off
  // instead of calling Gemini with an invalid key.
  const geminiKey =
    env.GEMINI_API_KEY && !/your_gemini_api_key/i.test(env.GEMINI_API_KEY)
      ? env.GEMINI_API_KEY
      : "";
  return {
    server: {
      port: 3000,
      // Local only. This dev server also hosts the trip data API, which must
      // not be reachable from the network.
      host: "localhost",
      fs: {
        // Vite would otherwise serve any project file by URL, including your
        // real data at /data/tripState.local.json. Data only goes through the
        // checked /api/trip-state route. (The first four are Vite's defaults.)
        deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/data/*.local.json"],
      },
    },
    plugins: [tripStateApiPlugin(), react()],
    define: {
      "process.env.API_KEY": JSON.stringify(geminiKey),
      "process.env.GEMINI_API_KEY": JSON.stringify(geminiKey),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
