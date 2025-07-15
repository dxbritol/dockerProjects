const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const axios = require("axios");
const path = require("path");
const cors = require("cors");

const config = require("./config.json");
const { Client, LocalAuth } = require("whatsapp-web.js");
const {
  inicializarMenu,
  contextos,
  guardarContexto,
  responderConBot,
} = require("./components/menu");

process.title = "whatsapp-node-api";

global.client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath: "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  },
  webVersionCache: {
    type: "remote",
    remotePath:
      "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1021680947-alpha.html",
  },
});

global.authed = false;

const app = express();
app.use(cors({ origin: "*" }));
const port = process.env.PORT || config.port;
app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// QR Event
client.on("qr", (qr) => {
  console.log("QR recibido:");
  console.log(qr.slice(0, 30) + "...");
  const qrPath = path.join(__dirname, "components", "last.qr");
  try {
    fs.writeFileSync(qrPath, qr);
    console.log("QR guardado correctamente en:", qrPath);
  } catch (err) {
    console.error("Error al guardar el QR:", err);
  }
});

client.on("authenticated", () => {
  console.log("AUTH!");
  authed = true;
  try {
    const qrPath = path.join(__dirname, "components", "last.qr");
    fs.unlinkSync(qrPath);
  } catch (err) {
    console.warn("No se pudo eliminar el QR:", err.message);
  }
});

client.on("auth_failure", () => {
  console.log("AUTH Failed !");
  process.exit();
});

client.on("ready", () => {
  console.log("Client is ready!");
});

client.on("message", async (msg) => {
  if (config.webhook.enabled) {
    if (msg.hasMedia) {
      const attachmentData = await msg.downloadMedia();
      msg.attachmentData = attachmentData;
    }
    axios.post(config.webhook.path, { msg });
  }
  /* ✅ Declarar primero
  const texto = msg.body?.toLowerCase().trim();
  const numero = msg.from;

  // ✅ Auto respuesta de despedida
  if (/(gracias|muchas gracias)/i.test(texto)) {
    await client.sendMessage(numero, "Un placer atenderte 😊");
  }*/
});

client.on("disconnected", () => {
  console.log("disconnected");
});

inicializarMenu(client);
client.initialize();

/* 🕓 Revisión automática por inactividad (solo si están fuera del menú)
setInterval(() => {
  const ahora = Date.now();
  const tiempoLimite = 15 * 60 * 1000;

  for (const numero in contextos) {
    const contexto = contextos[numero];
    if (
      contexto.estado === "esperandoHumano" &&
      ahora - contexto.ultimoMensaje > tiempoLimite
    ) {
      client.sendMessage(
        numero,
        "🕓 Finalizamos la conversación por inactividad.\n\nEn caso de que necesites nuevamente nuestra ayuda, no dudes en contactarnos. Un placer atenderte."
      ).catch((err) =>
        console.error(`Error al enviar mensaje de cierre automático a ${numero}:`, err.message)
      );

      delete contextos[numero];
    }
  }

  guardarContexto();
}, 60 * 1000);*/

// Rutas HTTP
const chatRoute = require("./components/chatting");
const groupRoute = require("./components/group");
const authRoute = require("./components/auth");
const contactRoute = require("./components/contact");

app.use((req, res, next) => {
  console.log(`${req.method} : ${req.path}`);
  next();
});

app.use("/chat", chatRoute);
app.use("/group", groupRoute);
app.use("/auth", authRoute);
app.use("/contact", contactRoute);

app.listen(port, () => {
  console.log("Server Running Live on Port : " + port);
});
