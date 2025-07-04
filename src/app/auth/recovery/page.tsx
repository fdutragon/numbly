"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import {
  Sparkles,
  Bell,
  ArrowLeft,
  Send,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function RecoveryPage() {
  const [formData, setFormData] = useState({
    nome: "",
    dataNascimento: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"form" | "sent" | "success">("form");
  const [error, setError] = useState("");

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/recovery-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setStep("sent");
      } else {
        setError(result.error || "Erro na recuperação");
      }
    } catch (error) {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Recuperar Acesso
          </h1>
          <p className="text-gray-600">
            Use a magia das notificações para voltar
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {step === "form" && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">
                  Identificação Mística
                </h2>
                <p className="text-sm text-gray-600">
                  Confirme seus dados para receber acesso via notificação
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRecovery} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Completo
                    </label>
                    <Input
                      placeholder="Seu nome completo"
                      value={formData.nome}
                      onChange={(value) =>
                        setFormData((prev) => ({ ...prev, nome: value }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Nascimento
                    </label>
                    <DateInput
                      value={formData.dataNascimento}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          dataNascimento: value,
                        }))
                      }
                      required
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-700 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {error}
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    loading={isLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    disabled={!formData.nome.trim() || !formData.dataNascimento}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Acesso Mágico
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {step === "sent" && (
            <Card>
              <CardContent className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle className="w-8 h-8 text-white" />
                </motion.div>

                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  🔮 Acesso Enviado!
                </h2>

                <p className="text-gray-600 mb-6">
                  Se seus dados estão corretos, você receberá uma notificação
                  mágica para acessar sua conta.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Dica:</strong> Verifique se as notificações estão
                    ativadas no seu navegador e aguarde alguns segundos.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => setStep("form")}
                    variant="outline"
                    className="w-full"
                  >
                    Tentar Novamente
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-6"
        >
          <Link
            href="/auth/register-push"
            className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar ao registro
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="text-center mt-4 text-sm text-gray-500"
        >
          <p>✨ A magia está a uma notificação de distância ✨</p>
        </motion.div>
      </div>
    </div>
  );
}
