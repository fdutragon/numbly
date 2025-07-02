import { User } from '@prisma/client';

// Definindo interface para o Mapa Numerológico
export interface MapaNumerologico {
  id: string;
  userId: string;
  data: any; // Ajuste conforme os campos reais do mapa
  createdAt: Date;
  updatedAt: Date;
}

export interface MeResponse {
  user: User;
  mapa?: MapaNumerologico;
}

export interface CheckDevicePushResponse {
  success: boolean;
  exists: boolean;
  hasPush: boolean;
  pushSent?: number;
  message: string;
  userName?: string;
  userId?: string;
  deviceIds: string[];
  token?: string;
}
