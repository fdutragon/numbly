// Simple logging utility for Clara
export function addSecurityLog(
  level: 'info' | 'warn' | 'error',
  context: {
    ip: string;
    userAgent: string;
    endpoint: string;
    method: string;
  },
  message: string,
  data?: any
) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, {
    ...context,
    data
  });
}
