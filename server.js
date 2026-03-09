const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());

console.log("BOOT cwd =", process.cwd());
console.log("BOOT VERIFY_TOKEN =", process.env.VERIFY_TOKEN);

// ✅ Meta Webhook Verification (GET)
app.get("/whatsapp", (req, res) => {
  console.log("VERIFY originalUrl =", req.originalUrl);
  console.log("VERIFY query =", req.query);

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("Webhook verified OK");
    return res.status(200).send(challenge);
  }

  console.log("Webhook verify FAILED", { mode, token, expected: process.env.VERIFY_TOKEN });
  return res.sendStatus(403);
});

// (por ahora) receptor POST para mensajes
app.post("/whatsapp", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const msg = value?.messages?.[0];

    if (!msg || msg.type !== "text") return res.sendStatus(200);

    const from = msg.from;
    const text = msg.text?.body || "";


const incomingText = text.trim().toUpperCase();

let replyText = "";

if (incomingText === "PDF") {

  replyText = `Aquí tiene la guía gratuita:
30 frases clave para participar en reuniones en inglés.
Aquí puede descargar la guía:
https://stepuplanguages.com/active-su-ingles-profesional

Esta guía le brinda algunas expresiones organizadas según contextos frecuentes de trabajo.

En el curso English for Work encontrará el entrenamiento completo, con práctica guiada y recursos en profundidad.

¿Desea fortalecer su inglés profesional y participar con mayor seguridad?
Escriba ASESOR.`;

} else if (incomingText === "PROGRAMA") {

  replyText = `English for Work es un entrenamiento práctico de 4 semanas para activar su inglés profesional en reuniones.
  Aquí puede ver la propuesta:
https://stepuplanguages.com/english-for-work
Incluye:
• Expresiones funcionales
• Simulación de reuniones
• Activación guiada

Si este programa es lo que usted necesita, escriba ASESOR.`;

} else if (incomingText === "ASESOR") {

  replyText = `Gracias por su interés.

En breve un asesor de Step Up se comunicará con usted para brindarle atención personalizada.`;

} else {

  replyText = `👋 Hola. Soy el English Coach de 
  Step Up – Professional Language Services.

Estoy aquí para ayudarle a fortalecer su inglés profesional.

Escriba una de estas opciones:

PDF – recibir la guía gratuita: 30 Frases Clave para participar en reuniones en inglés  
PROGRAMA – información sobre el entrenamiento de 4 semanas: English for Work  
ASESOR – atención personalizada`;
}

    const url = `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: from,
      text: { body: replyText },
    };

    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json();
    console.log("SENT:", data);

    return res.sendStatus(200);
  } catch (err) {
    console.error("ERROR in /whatsapp:", err);
    return res.sendStatus(200);
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));