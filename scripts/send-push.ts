// scripts/send-push.ts
// Script Node.js para enviar push notification para um deviceId específico

import fetch from "node-fetch";

const API_URL = "http://localhost:3000/api/push/send"; // Ajuste para o endpoint real
const deviceId = process.argv[2] || "device_1751476400941";

async function main() {
  if (!deviceId) {
    console.error("DeviceId não informado!");
    process.exit(1);
  }

  const payload = {
    deviceId,
    title: "Notificação de Teste",
    body: "Push enviado via script para deviceId: " + deviceId,
    url: "https://www.numbly.life/",
  };

  console.log("Enviando push para", deviceId);
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await res.json();
  if (!res.ok) {
    console.error("Erro ao enviar push:", result);
    process.exit(1);
  }
  console.log("Push enviado com sucesso:", result);
}

main();
