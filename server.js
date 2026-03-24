import express from "express";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import { networkInterfaces } from "os";

const app = express();
const port = process.env.PORT || 80;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let data;
let filename;

app.use(express.raw({ type: "application/octet-stream", limit: "256mb" })); // 256mb or 0.25bg

app.post("/data", async (req, res) => {
  data = req.body;
  filename = req.headers["x-filename"] || "response.bin";
  console.log("Recieved file: '" + filename + "' successfully");
  res.sendStatus(200);
});

app.get("/data", async (req, res) => {
  if (!data) {
    return res.status(404).send("No data available");
  }

  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(data);
});

app.use(express.text());

// For waking up a render application
app.get("/wake", (req, res) => {
  res.send("App is awake");
});

app.use(express.static(path.join(__dirname, "public")));

const server = app.listen(port, () => {
  const nets = networkInterfaces();
  const results = Object.values(nets)
    .flat()
    .filter((net) => net.family === "IPv4" && !net.internal)
    .map(({ address }) => address);

  console.log(
    `Server is running on \x1b[36mport ${port}\x1b[0m at the following ip addresses:`,
  );
  console.log("\x1b[32m" + results.join("\x1b[0m, \x1b[32m") + "\x1b[0m");

  // Only do this when running locally
  if (!process.env.RENDER) {
    console.log("\nPress Enter to stop the server");
    waitForInput();
  }
});

function waitForInput() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("line", () => {
    console.log("Stopping server...");
    server.close(() => {
      console.log("Server stopped");
      process.exit(0);
    });
  });
}
