"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { usePushNotifications } from "@/hooks/usePushAuth";
import {
  Sparkles,
  Bell,
  Shield,
  Zap,
  Heart,
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Smartphone,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface RegistrationStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export default function PushAuthRegisterPage() {
  const router = useRouter();

  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: "",
    dataNascimento: "",
  });

  // Estados do fluxo
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPushRequest, setShowPushRequest] = useState(false);
  const [showSecondAttempt, setShowSecondAttempt] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  // Hook de push notifications
  const {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    error: pushError,
    requestPermission,
  } = usePushNotifications();

  // Passos do registro
  const steps: RegistrationStep[] = [
    {
      id: "info",
      title: "Informações Básicas",
      description: "Nome e data de nascimento",
      completed: currentStep > 1,
    },
    {
      id: "push",
      title: "Ativação Mística",
      description: "Conectar com o oráculo",
      completed: isSubscribed,
    },
    {
      id: "complete",
      title: "Jornada Iniciada",
      description: "Bem-vindo ao Numbly Life",
      completed: registrationComplete,
    },
  ];

  useEffect(() => {
    if (isSubscribed && currentStep === 2) {
      handleRegistrationComplete();
    }
  }, [isSubscribed, currentStep]);

  const handleBasicInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim() || !formData.dataNascimento) {
      return;
    }

    setCurrentStep(2);
    setShowPushRequest(true);
  };

  const handlePushActivation = async () => {
    setIsLoading(true);

    try {
      const success = await subscribe();

      if (success) {
        // Registrar usuário no backend
        await registerUser();
      } else {
        setShowSecondAttempt(true);
      }
    } catch (error) {
      console.error("Erro na ativação:", error);
      setShowSecondAttempt(true);
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async () => {
    try {
      const response = await fetch("/api/auth/register-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Usuário registrado:", result);
      }
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
    }
  };

  const handleRegistrationComplete = () => {
    setCurrentStep(3);
    setRegistrationComplete(true);

    // Aguardar um momento e redirecionar
    setTimeout(() => {
      router.push("/dashboard");
    }, 3000);
  };

  const handleSecondAttempt = async () => {
    setIsLoading(true);

    try {
      // Tentar novamente com mais ênfase
      const permission = await requestPermission();

      if (permission === "granted") {
        const success = await subscribe();
        if (success) {
          await registerUser();
        } else {
          // Se falhar novamente, permitir acesso limitado
          handleLimitedAccess();
        }
      } else {
        handleLimitedAccess();
      }
    } catch (error) {
      console.error("Segunda tentativa falhou:", error);
      handleLimitedAccess();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLimitedAccess = () => {
    // Permitir acesso limitado sem push
    console.log("Acesso limitado concedido");
    router.push("/dashboard?limited=true");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header Místico */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Numbly Life
          </h1>
          <p className="text-gray-600">
            Sua jornada numerológica está prestes a começar
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    step.completed
                      ? "bg-green-500 text-white"
                      : currentStep === index + 1
                        ? "bg-purple-500 text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-1 mx-2 transition-all duration-300 ${
                      step.completed ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-center">
            <p className="text-sm font-medium text-gray-900">
              {steps[currentStep - 1]?.title}
            </p>
            <p className="text-xs text-gray-500">
              {steps[currentStep - 1]?.description}
            </p>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Passo 1: Informações Básicas */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Vamos nos conhecer
                  </h2>
                  <p className="text-sm text-gray-600">
                    Precisamos apenas do essencial para calcular seu mapa
                    numerológico
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBasicInfoSubmit} className="space-y-4">
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

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
                      disabled={
                        !formData.nome.trim() || !formData.dataNascimento
                      }
                    >
                      Continuar <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Passo 2: Ativação Push */}
          {currentStep === 2 && !showSecondAttempt && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      Conecte-se com o Oráculo
                    </h2>
                    <p className="text-sm text-gray-600">
                      Para uma experiência completa, ative as notificações
                      místicas
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                    <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                      <Star className="w-4 h-4 mr-2 text-yellow-500" />
                      Vantagens Místicas
                    </h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li className="flex items-center">
                        <Zap className="w-3 h-3 mr-2 text-purple-500" />
                        Mensagens diárias personalizadas do oráculo
                      </li>
                      <li className="flex items-center">
                        <Heart className="w-3 h-3 mr-2 text-pink-500" />
                        Alertas de compatibilidade em tempo real
                      </li>
                      <li className="flex items-center">
                        <Shield className="w-3 h-3 mr-2 text-blue-500" />
                        Acesso seguro sem senhas
                      </li>
                      <li className="flex items-center">
                        <Sparkles className="w-3 h-3 mr-2 text-purple-500" />
                        Insights numerológicos instantâneos
                      </li>
                    </ul>
                  </div>

                  {!isSupported && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-700 flex items-center">
                        <XCircle className="w-4 h-4 mr-2" />
                        Seu navegador não suporta notificações push
                      </p>
                    </div>
                  )}

                  {pushError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-700">{pushError}</p>
                    </div>
                  )}

                  <Button
                    onClick={handlePushActivation}
                    disabled={!isSupported || isLoading}
                    loading={isLoading}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Ativar Conexão Mística
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    Clique em "Permitir" quando seu navegador solicitar
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Segunda Tentativa */}
          {showSecondAttempt && (
            <motion.div
              key="step2-retry"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      Conexão Ainda Mais Importante!
                    </h2>
                    <p className="text-sm text-gray-600">
                      Sem notificações, você perderá momentos mágicos únicos
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
                    <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                      <Lock className="w-4 h-4 mr-2 text-red-500" />
                      Sem Notificações Você Perde:
                    </h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li className="flex items-center">
                        <XCircle className="w-3 h-3 mr-2 text-red-500" />
                        Recuperação de acesso automática
                      </li>
                      <li className="flex items-center">
                        <XCircle className="w-3 h-3 mr-2 text-red-500" />
                        Mensagens do oráculo em momentos cruciais
                      </li>
                      <li className="flex items-center">
                        <XCircle className="w-3 h-3 mr-2 text-red-500" />
                        Alertas de energia numerológica
                      </li>
                      <li className="flex items-center">
                        <XCircle className="w-3 h-3 mr-2 text-red-500" />
                        Segurança total da sua conta
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={handleSecondAttempt}
                      disabled={isLoading}
                      loading={isLoading}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      Sim, Quero a Experiência Completa!
                    </Button>

                    <Button
                      onClick={handleLimitedAccess}
                      variant="outline"
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Continuar sem Notificações (Limitado)
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    Recomendamos fortemente ativar para a experiência completa
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Passo 3: Conclusão */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardContent className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle className="w-10 h-10 text-white" />
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-2xl font-bold text-gray-900 mb-3"
                  >
                    🎉 Bem-vindo ao Numbly Life!
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="text-gray-600 mb-6"
                  >
                    Sua jornada numerológica foi iniciada com sucesso. O oráculo
                    já está preparando suas primeiras revelações...
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="text-sm text-gray-500"
                  >
                    Redirecionando para seu dashboard em instantes...
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="text-center mt-8 text-sm text-gray-500"
        >
          <p>✨ Sua privacidade é sagrada para nós ✨</p>
        </motion.div>
      </div>
    </div>
  );
}
