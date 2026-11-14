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

const readRequestBody = async (req: any) => {
  return new Promise<string>((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
};

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

          if (!currencyCode || !paymentDate) {
            res.statusCode = 400;
            res.end(
              JSON.stringify({
                error: "currencyCode and paymentDate are required",
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
          const body = await readRequestBody(req);
          const parsed = JSON.parse(body);
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
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Failed to process API request" }));
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [tripStateApiPlugin(), react()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
