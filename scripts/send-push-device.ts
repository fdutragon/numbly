// scripts/send-push-device.ts
// Script TypeScript para enviar push notification para um deviceId específico

import fetch from "node-fetch";

const API_URL = "http://localhost:3000/api/push/send"; // Ajuste conforme necessário
const deviceId = process.argv[2];

if (!deviceId) {
  console.error("Uso: npx tsx scripts/send-push-device.ts <deviceId>");
  process.exit(1);
}

async function sendPush() {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetDeviceId: deviceId, // Corrigido para o campo aceito pelo endpoint
        title: "Teste Push",
        body: "Mensagem de teste para o deviceId: " + deviceId,
      }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(data?.error || "Erro desconhecido");
    console.log("Push enviado com sucesso:", data);
  } catch (err: unknown) {
    console.error(
      "Erro ao enviar push:",
      err instanceof Error ? err.message : "Erro desconhecido",
    );
    process.exit(1);
  }
}

sendPush();
