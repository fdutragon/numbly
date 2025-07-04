// scripts/send-push-device.js
// Script para enviar push notification para um deviceId específico

const fetch = require("node-fetch");

const API_URL = "http://localhost:3000/api/push/send"; // Altere para o endpoint real se necessário
const deviceId = process.argv[2];

if (!deviceId) {
  console.error("Uso: node scripts/send-push-device.js <deviceId>");
  process.exit(1);
}

async function sendPush() {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId,
        title: "Teste Push",
        body: "Mensagem de teste para o deviceId: " + deviceId,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Erro desconhecido");
    console.log("Push enviado com sucesso:", data);
  } catch (err) {
    console.error("Erro ao enviar push:", err.message);
    process.exit(1);
  }
}

sendPush();
