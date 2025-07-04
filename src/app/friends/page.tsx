"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  Users,
  UserPlus,
  Heart,
  Star,
  MessageCircle,
  Share2,
  Clock,
  Eye,
  Gift,
  Copy,
  Check,
  Sparkles,
  Plus,
  ArrowLeft,
  Crown,
  Code,
  Send,
  X,
  ExternalLink,
} from "lucide-react";
import { NavBar } from "@/components/ui/navbar";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Modo desenvolvimento - permite testes gratuitos
const isDevelopment =
  process.env.NODE_ENV === "development" ||
  (typeof window !== "undefined" && window.location.hostname === "localhost");

interface InviteData {
  id: string;
  code: string;
  invitedName: string;
  relationshipType: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED";
  clicks: number;
  createdAt: string;
  expiresAt?: string;
  isRevealed: boolean;
  inviteUrl: string;
  customMessage?: string;
}

const relationshipOptions = [
  {
    value: "FRIEND",
    label: "Amigo(a)",
    icon: "👫",
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  {
    value: "FAMILY",
    label: "Família",
    icon: "👨‍👩‍👧‍👦",
    color: "from-green-500 to-green-600",
    bg: "bg-green-50",
    text: "text-green-700",
  },
  {
    value: "ROMANTIC",
    label: "Parceiro(a)",
    icon: "💕",
    color: "from-pink-500 to-pink-600",
    bg: "bg-pink-50",
    text: "text-pink-700",
  },
  {
    value: "BUSINESS",
    label: "Sócio(a)",
    icon: "🤝",
    color: "from-purple-500 to-purple-600",
    bg: "bg-purple-50",
    text: "text-purple-700",
  },
  {
    value: "CRUSH",
    label: "Paquera",
    icon: "😍",
    color: "from-red-500 to-red-600",
    bg: "bg-red-50",
    text: "text-red-700",
  },
  {
    value: "PET",
    label: "Pet",
    icon: "🐾",
    color: "from-orange-500 to-orange-600",
    bg: "bg-orange-50",
    text: "text-orange-700",
  },
  {
    value: "OTHER",
    label: "Outro",
    icon: "✨",
    color: "from-gray-500 to-gray-600",
    bg: "bg-gray-50",
    text: "text-gray-700",
  },
];

export default function FriendsPage() {
  const { user, requireAuth } = useAuth();
  const router = useRouter();

  // Proteger rota
  requireAuth();

  const [invites, setInvites] = useState<InviteData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Estados do formulário
  const [formData, setFormData] = useState({
    invitedName: "",
    relationshipType: "FRIEND",
    customMessage: "",
  });
  const [errors, setErrors] = useState<{ invitedName?: string }>({});

  // Dados mockados para desenvolvimento
  const mockInvites: InviteData[] = [
    {
      id: "1",
      code: "ABC123",
      invitedName: "Ana Silva",
      relationshipType: "FRIEND",
      status: "ACCEPTED",
      clicks: 5,
      createdAt: new Date().toISOString(),
      isRevealed: true,
      inviteUrl: "https://numbly.app/convite/ABC123",
    },
    {
      id: "2",
      code: "DEF456",
      invitedName: "João Santos",
      relationshipType: "ROMANTIC",
      status: "PENDING",
      clicks: 2,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      isRevealed: false,
      inviteUrl: "https://numbly.app/convite/DEF456",
      customMessage: "Vamos descobrir nossa compatibilidade! 💕",
    },
    {
      id: "3",
      code: "GHI789",
      invitedName: "Maria Costa",
      relationshipType: "FAMILY",
      status: "PENDING",
      clicks: 1,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      isRevealed: false,
      inviteUrl: "https://numbly.app/convite/GHI789",
    },
  ];

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    setLoading(true);
    try {
      if (isDevelopment) {
        // Em desenvolvimento, usar dados mockados
        setTimeout(() => {
          setInvites(mockInvites);
          setLoading(false);
        }, 500);
        return;
      }

      // Em produção, fazer chamada real para API
      const response = await fetch("/api/friends/invite", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvites(data.invites || []);
      }
    } catch (error) {
      console.error("Erro ao carregar convites:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: { invitedName?: string } = {};

    if (!formData.invitedName.trim()) {
      newErrors.invitedName = "Nome é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateInvite = async () => {
    if (!validateForm()) return;

    // Verificar premium (exceto em desenvolvimento)
    if (!user?.isPremium && !isDevelopment && invites.length >= 1) {
      setShowPremiumModal(true);
      return;
    }

    setLoading(true);

    try {
      if (isDevelopment) {
        // Em desenvolvimento, simular criação
        const newInvite: InviteData = {
          id: Date.now().toString(),
          code: Math.random().toString(36).substring(2, 8).toUpperCase(),
          invitedName: formData.invitedName,
          relationshipType: formData.relationshipType,
          status: "PENDING",
          clicks: 0,
          createdAt: new Date().toISOString(),
          isRevealed: false,
          inviteUrl: `https://numbly.app/convite/${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          customMessage: formData.customMessage || undefined,
        };

        setTimeout(() => {
          setInvites((prev) => [newInvite, ...prev]);
          setFormData({
            invitedName: "",
            relationshipType: "FRIEND",
            customMessage: "",
          });
          setIsModalOpen(false);
          setLoading(false);
        }, 800);
        return;
      }

      // Em produção, fazer chamada real
      const response = await fetch("/api/friends/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newInvite = await response.json();
        setInvites((prev) => [newInvite, ...prev]);
        setFormData({
          invitedName: "",
          relationshipType: "FRIEND",
          customMessage: "",
        });
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Erro ao criar convite:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Erro ao copiar:", error);
    }
  };

  const getRelationshipOption = (type: string) => {
    return (
      relationshipOptions.find((opt) => opt.value === type) ||
      relationshipOptions[0]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "text-green-600 bg-green-50 border-green-200";
      case "PENDING":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "EXPIRED":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "Aceito";
      case "PENDING":
        return "Pendente";
      case "EXPIRED":
        return "Expirado";
      default:
        return status;
    }
  };

  if (loading && invites.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Carregando convites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header minimalista */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard">
              <button className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
            </Link>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Amigos</h1>
              <p className="text-sm text-gray-500">
                Convide pessoas para descobrir a compatibilidade
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isDevelopment && (
              <div className="px-2 py-1 bg-green-100 rounded-full flex items-center gap-1">
                <Code className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-700 font-medium">DEV</span>
              </div>
            )}
            <Button
              onClick={() => setIsModalOpen(true)}
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Convite
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-6 py-8 pb-20">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Convide Seus Amigos
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Crie convites personalizados e descubra a compatibilidade
            numerológica com pessoas importantes da sua vida.
          </p>
          {isDevelopment && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <Code className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Modo Desenvolvimento Ativo
                </span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Todos os recursos premium estão liberados para testes
              </p>
            </div>
          )}
        </motion.div>

        {/* Lista de convites */}
        <div className="space-y-4">
          {invites.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 bg-white rounded-xl border border-gray-200"
            >
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum convite ainda
              </h3>
              <p className="text-gray-600 mb-6">
                Crie seu primeiro convite e compartilhe com alguém especial!
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Convite
              </Button>
            </motion.div>
          ) : (
            <AnimatePresence>
              {invites.map((invite, index) => {
                const relationshipOption = getRelationshipOption(
                  invite.relationshipType,
                );

                return (
                  <motion.div
                    key={invite.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${relationshipOption.bg}`}
                        >
                          {relationshipOption.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {invite.invitedName}
                          </h3>
                          <p className={`text-sm ${relationshipOption.text}`}>
                            {relationshipOption.label}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(invite.status)}`}
                      >
                        {getStatusText(invite.status)}
                      </div>
                    </div>

                    {invite.customMessage && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700 italic">
                          "{invite.customMessage}"
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{invite.clicks} visualizações</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(invite.createdAt).toLocaleDateString(
                              "pt-BR",
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(invite.inviteUrl, invite.id)
                        }
                        className="flex-1"
                      >
                        {copiedId === invite.id ? (
                          <>
                            <Check className="w-4 h-4 mr-2 text-green-600" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar Link
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: "Convite Numbly",
                              text: `${user?.name} te convidou para descobrir a compatibilidade numerológica! ${invite.customMessage || ""}`,
                              url: invite.inviteUrl,
                            });
                          } else {
                            copyToClipboard(invite.inviteUrl, invite.id);
                          }
                        }}
                        className="bg-gradient-to-r from-blue-500 to-purple-600"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Compartilhar
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Modal de criação de convite */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormData({
            invitedName: "",
            relationshipType: "FRIEND",
            customMessage: "",
          });
          setErrors({});
        }}
        title="Criar Novo Convite"
        size="lg"
      >
        <div className="space-y-6 bg-white p-6 rounded-lg max-h-[80vh] overflow-y-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Convide Alguém Especial
            </h3>
            <p className="text-gray-600">
              Preencha os dados abaixo para criar um convite personalizado
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da pessoa
              </label>
              <Input
                type="text"
                placeholder="Digite o nome completo..."
                value={formData.invitedName}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, invitedName: value }))
                }
                className={`w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors ${errors.invitedName ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""}`}
              />
              {errors.invitedName && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.invitedName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de relacionamento
              </label>
              <div className="grid grid-cols-2 gap-3">
                {relationshipOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        relationshipType: option.value,
                      }))
                    }
                    className={`p-3 border rounded-lg text-left transition-all duration-200 ${
                      formData.relationshipType === option.value
                        ? `border-blue-500 ${option.bg} ${option.text}`
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{option.icon}</span>
                      <span className="font-medium text-sm">
                        {option.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem personalizada (opcional)
              </label>
              <textarea
                placeholder="Adicione uma mensagem especial..."
                value={formData.customMessage}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customMessage: e.target.value,
                  }))
                }
                rows={3}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateInvite}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Criar Convite
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Premium Modal */}
      <Modal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        title="Recurso Premium"
        size="md"
      >
        <div className="text-center bg-white p-6 rounded-lg">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-8 h-8 text-white" />
          </div>

          <h3 className="text-xl font-semibold mb-4">
            Convites Ilimitados Premium
          </h3>

          <p className="text-gray-600 mb-8">
            Para criar mais convites e acessar recursos avançados, você precisa
            do plano Premium.
          </p>

          <div className="space-y-3">
            <Button className="w-full" size="lg">
              <Crown className="w-4 h-4 mr-2" />
              Assinar Premium - R$ 19,90/mês
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowPremiumModal(false)}
              className="w-full"
            >
              Continuar com Plano Gratuito
            </Button>
          </div>
        </div>
      </Modal>

      {/* Navbar */}
      <NavBar />
    </div>
  );
}
