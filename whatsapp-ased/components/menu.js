const fs = require("fs");
const moment = require("moment-timezone");

const CONTEXT_PATH = "./components/context.json";
let contextos = {};

if (fs.existsSync(CONTEXT_PATH)) {
  contextos = JSON.parse(fs.readFileSync(CONTEXT_PATH));
}

function guardarContexto() {
  fs.writeFileSync(CONTEXT_PATH, JSON.stringify(contextos, null, 2));
}

function estaEnHorario() {
  const ahora = moment().tz("America/Guayaquil");
  const minutos = ahora.hour() * 60 + ahora.minute();
  const dia = ahora.day(); // Domingo = 0
  return (
    dia !== 0 &&
    ((minutos >= 480 && minutos <= 1020) || (minutos >= 1140 && minutos <= 1260))
  );
}

function inicializarMenu(client) {
  client.on("message", async (msg) => {
    const numero = msg.from;
    const texto = msg.body?.toLowerCase().trim();
    const nombres = require("./nombres.json");
    const nombre = nombres[msg.from] || msg._data?.notifyName || "Usuario";
    const nombreSolo = nombre.split(" ")[0];
//	  const nombre = msg._data?.notifyName || "Usuario";
    const ahora = Date.now();
    const tiempoLimite = 60 * 60 * 1000;
    const contieneSaludo = /(menu|reiniciar|menú)/i.test(texto);
    const enHorario = estaEnHorario();

    if (/(gracias|muchas gracias)/i.test(texto)) {
      await client.sendMessage(numero, `Un placer atenderte *${nombreSolo}* 😊`);
    }

    if (contextos[numero] && ahora - contextos[numero].ultimoMensaje > tiempoLimite) {
      delete contextos[numero];
    }

    if (msg.fromMe && ["un gusto", "saludos", "de nada"].includes(texto)) {
      if (contextos[numero]) {
        delete contextos[numero];
        guardarContexto();
        return client.sendMessage(numero, generarMensajeMenu(nombre));
      }
    }

    if (!contextos[numero]) {
      const nuevoContexto = {
        estado: "esperandoHumano",
        ultimoMensaje: ahora,
        vinoDelMenu: false,
        fueraHorarioMostrado: false,
        recordatorioMostrado: false
      };

      if (!enHorario && !nuevoContexto.fueraHorarioMostrado) {
        await client.sendMessage(
          numero,
          `👋Hola *${nombre}*, responderemos tu requerimiento lo antes posible\n🕒 Nuestro horario de atención es de Lunes a Viernes de 08h00 a 17h00 y de 19h00 a 21h00 (Sábados, Domingos y Feriados, tratamos de estar en línea el mayor tiempo)\n\nAgradecemos tu paciencia 😊.`
        );
        nuevoContexto.fueraHorarioMostrado = true;
      }

      if (contieneSaludo) {
        nuevoContexto.estado = "inicio";
        nuevoContexto.vinoDelMenu = true;
        contextos[numero] = nuevoContexto;
        guardarContexto();
        return client.sendMessage(numero, generarMensajeMenu(nombre));
      } else {
        if (!nuevoContexto.recordatorioMostrado) {
          await client.sendMessage(
            numero,
            enHorario
              ? `👋Hola *${nombre}*, si deseas Soporte, Renovación o Adquirir un servicio. \n\nEscribre la palabra *menu*.`
              : "Recuerda si deseas Soporte, Renovación o Adquirir un servicio. \n\nEscribre la palabra *menu*. \nAtenderemos el requerimiento cuando estemos disponibles nuevamente."
          );
          nuevoContexto.recordatorioMostrado = true;
        }
        contextos[numero] = nuevoContexto;
        guardarContexto();
        return;
      }
    }

    const estado = contextos[numero].estado;

    if (estado === "esperandoHumano") {
      if (contieneSaludo) {
        contextos[numero] = {
          ...contextos[numero],
          estado: "inicio",
          ultimoMensaje: ahora,
          vinoDelMenu: true
        };
        guardarContexto();
        return client.sendMessage(numero, generarMensajeMenu(nombre));
      }

      if (!contextos[numero].recordatorioMostrado && !contextos[numero].vinoDelMenu) {
        contextos[numero].recordatorioMostrado = true;
        contextos[numero].ultimoMensaje = ahora;
        guardarContexto();
        return client.sendMessage(
          numero,
          enHorario
            ? `👋Hola *${nombre}*, si deseas Soporte, Renovación o Adquirir un servicio. \n\nEscribre la palabra *menu*.`
            : "Recuerda si deseas Soporte, Renovación o Adquirir un servicio. \n\nEscribre la palabra *menu*. \nAtenderemos el requerimiento cuando estemos disponibles nuevamente."
	);
      }

      return;
    }

    contextos[numero].ultimoMensaje = ahora;
    contextos[numero].recordatorioMostrado = false;
    guardarContexto();

    // Opción 1: Soporte
    if (estado === "inicio") {
      if (texto === "1" || texto.includes("soporte")) {
        contextos[numero] = {
          estado: "esperandoHumano",
          ultimoMensaje: ahora,
          vinoDelMenu: true,
          fueraHorarioMostrado: contextos[numero].fueraHorarioMostrado,
          recordatorioMostrado: false
        };
        guardarContexto();

        const mensaje = enHorario
          ? "⚙️  Por favor ayúdanos con lo siguiente:\nDescribe el problema *detalladamente*, el *usuario y la plataforma* que presenta el inconveniente.\nAdjunta *una captura* clara.\n\nUn asesor se comunicará contigo en breve.\n\nEscribe *menu* si necesitas otra opción."
          : "⚙️  Por favor ayúdanos con lo siguiente:\nDescribe el problema *detalladamente*, el *usuario y la plataforma* que presenta el inconveniente.\nAdjunta *una captura* clara.\n\n🕒 Actualmente estamos fuera de horario, pero tu mensaje será atendido apenas estemos disponibles.\n\nEscribe *menu* si necesitas otra opción.";

        return client.sendMessage(numero, mensaje);
      }

      // Opción 2: Ventas
      if (texto === "2" || texto.includes("ventas")) {
        contextos[numero] = {
          estado: "ventas",
          ultimoMensaje: ahora,
          vinoDelMenu: true,
          fueraHorarioMostrado: contextos[numero].fueraHorarioMostrado,
          recordatorioMostrado: false
        };
        guardarContexto();

        return client.sendMessage(numero, "🛒 ¿Qué servicio deseas contratar?");
      }

      // Opción 3: Renovar
      if (texto === "3" || texto.includes("renovar")) {
        contextos[numero] = {
          estado: "esperandoHumano",
          ultimoMensaje: ahora,
          vinoDelMenu: true,
          fueraHorarioMostrado: contextos[numero].fueraHorarioMostrado,
          recordatorioMostrado: false
        };
        guardarContexto();

        const mensaje = enHorario
          ? "🔄 Asegura el valor a pagar y realiza la transferencia.\nAdjunta tu comprobante de pago y procederemos a renovar tu servicio.\n\nEscribe *menu* si necesitas otra opción."
          : "🔄 Asegura el valor a pagar y realiza la transferencia.\nAdjunta tu comprobante de pago y procederemos a renovar tu servicio cuando estemos nuevamente disponibles.\n\nEscribe *menu* si necesitas otra opción.";

        return client.sendMessage(numero, mensaje);
      }

      // Opción 4: Asesor
      if (texto === "4" || texto.includes("asesor")) {
        contextos[numero] = {
          estado: "esperandoHumano",
          ultimoMensaje: ahora,
          vinoDelMenu: true,
          fueraHorarioMostrado: contextos[numero].fueraHorarioMostrado,
          recordatorioMostrado: false
        };
        guardarContexto();

        const mensaje = enHorario
          ? "👤 Un asesor te atenderá lo más pronto posible.\n\nGracias por tu paciencia."
          : "👤 Un asesor te atenderá lo más pronto posible.\n\n🕒 Actualmente estamos fuera de horario, pero tu mensaje será respondido apenas estemos disponibles.";

        return client.sendMessage(numero, mensaje);
      }

      return client.sendMessage(
        numero,
        "Por favor selecciona una opción válida:\n1️⃣ Soporte\n2️⃣ Ventas\n3️⃣ Renovar\n4️⃣ Chatear con un asesor"
      );
    }

    if (estado === "ventas") {
      if (texto.length > 3) {
        const mensaje = enHorario
          ? `Gracias por tu interés en: *"${msg.body}"*. Un asesor de ventas te contactará pronto.\n\nEscribe *menu* si necesitas otra opción.`
          : `Gracias por tu interés en: *"${msg.body}"*. 🕒 Actualmente estamos fuera de horario, pero un asesor de ventas te atenderá apenas estemos disponibles.\n\nEscribe *menu* si necesitas otra opción.`;

        contextos[numero] = {
          estado: "esperandoHumano",
          ultimoMensaje: ahora,
          vinoDelMenu: true,
          fueraHorarioMostrado: contextos[numero].fueraHorarioMostrado,
          recordatorioMostrado: false
        };
        guardarContexto();

        return client.sendMessage(numero, mensaje);
      } else {
        return client.sendMessage(
          numero,
          "Por favor, indícanos qué servicio deseas contratar."
        );
      }
    }
  });
}

function generarMensajeMenu(nombre) {
  return `Hola *${nombre}*, te saluda *AsedinfoBot* 🤓\n¿En qué te podemos ayudar?\n\n` +
         `1️⃣ Soporte\n` +
         `2️⃣ Ventas\n` +
         `3️⃣ Renovar un servicio contratado\n` +
         `4️⃣ Chatear con un asesor\n\n` +
         `Responde con el número de la opción.`;
}

module.exports = { inicializarMenu };
