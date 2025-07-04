"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import {
  Heart,
  Users,
  Clock,
  Sparkles,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import { gerarMapaNumerologicoCompleto } from "@/lib/numerologia";

interface InviteData {
  code: string;
  senderName: string;
  senderProfileImage?: string;
  invitedName: string;
  relationshipType: string;
  customMessage?: string;
  status: string;
  expiresAt?: string;
  createdAt: string;
}

const relationshipTypeLabels = {
  FRIEND: { label: "Amigo(a)", icon: "👫", color: "blue" },
  FAMILY: { label: "Família", icon: "👨‍👩‍👧‍👦", color: "green" },
  ROMANTIC: { label: "Parceiro(a)", icon: "💕", color: "pink" },
  BUSINESS: { label: "Sócio(a)", icon: "🤝", color: "purple" },
  CRUSH: { label: "Paquera", icon: "😍", color: "red" },
  PET: { label: "Pet", icon: "🐾", color: "orange" },
  OTHER: { label: "Outro", icon: "✨", color: "gray" },
};

export default function ConvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dados do formulário
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");

  useEffect(() => {
    if (code) {
      fetchInviteData();
    }
  }, [code]);

  const fetchInviteData = async () => {
    try {
      const response = await fetch(`/api/friends/accept?code=${code}`);
      const result = await response.json();

      if (result.success) {
        setInviteData(result.data);
        setNome(result.data.invitedName); // Pré-preencher nome
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Erro ao carregar convite");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome || !dataNascimento) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      // Calcular mapa numerológico
      const numerologyData = gerarMapaNumerologicoCompleto(
        nome,
        dataNascimento,
      );

      const response = await fetch("/api/friends/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          userData: {
            nome,
            email,
            dataNascimento,
            numerologyData,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Sucesso! Redirecionar para dashboard ou página de resultado
        router.push(`/convite/${code}/resultado`);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Erro ao aceitar convite");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Carregando convite...</p>
        </div>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ops!</h2>
            <p className="text-gray-700 mb-4">{error}</p>
            <Button onClick={() => router.push("/")} className="w-full">
              Ir para o início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteData) return null;

  const relationshipInfo =
    relationshipTypeLabels[
      inviteData.relationshipType as keyof typeof relationshipTypeLabels
    ] || relationshipTypeLabels.OTHER;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="text-4xl mb-2">{relationshipInfo.icon}</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Você foi convidado!
            </h1>
            <p className="text-gray-700">
              <span className="font-semibold">{inviteData.senderName}</span>{" "}
              quer descobrir a compatibilidade numerológica de vocês como{" "}
              <span className="font-semibold">
                {relationshipInfo.label.toLowerCase()}
              </span>
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {inviteData.customMessage && (
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-medium text-purple-900 mb-2">
                  💌 Mensagem especial:
                </h3>
                <p className="text-purple-800 italic">
                  "{inviteData.customMessage}"
                </p>
              </div>
            )}

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center mb-2">
                <Sparkles className="w-5 h-5 text-yellow-600 mr-2" />
                <h3 className="font-semibold text-yellow-800">
                  Como funciona:
                </h3>
              </div>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Você preenche seus dados</li>
                <li>• Calculamos seu mapa numerológico</li>
                <li>• Revelamos a compatibilidade entre vocês</li>
                <li>• Vocês ganham acesso ao oráculo combinado!</li>
              </ul>
            </div>

            <form onSubmit={handleAcceptInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seu nome completo *
                </label>
                <Input
                  type="text"
                  value={nome}
                  onChange={setNome}
                  placeholder="Digite seu nome completo"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de nascimento *
                </label>
                <DateInput
                  value={dataNascimento}
                  onChange={setDataNascimento}
                  placeholder="DD/MM/AAAA"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (opcional)
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="seu@email.com"
                  className="w-full"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={accepting}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {accepting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Heart className="w-4 h-4 mr-2" />
                    Aceitar e Revelar Compatibilidade
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Ao aceitar, você concorda com nossos termos e criará uma conta
                no Numbly.Life
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            ✨ Descubra o poder dos números em seus relacionamentos ✨
          </p>
        </div>
      </motion.div>
    </div>
  );
}
