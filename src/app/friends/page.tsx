'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { AppLayout } from '@/components/ui/app-layout';
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
  Plus
} from 'lucide-react';

interface InviteData {
  id: string;
  code: string;
  invitedName: string;
  relationshipType: string;
  status: string;
  clicks: number;
  createdAt: string;
  expiresAt?: string;
  isRevealed: boolean;
  inviteUrl: string;
  customMessage?: string;
}

const relationshipOptions = [
  { value: 'FRIEND', label: 'Amigo(a)', icon: '👫', color: 'blue' },
  { value: 'FAMILY', label: 'Família', icon: '👨‍👩‍👧‍👦', color: 'green' },
  { value: 'ROMANTIC', label: 'Parceiro(a)', icon: '💕', color: 'pink' },
  { value: 'BUSINESS', label: 'Sócio(a)', icon: '🤝', color: 'purple' },
  { value: 'CRUSH', label: 'Paquera', icon: '😍', color: 'red' },
  { value: 'PET', label: 'Pet', icon: '🐾', color: 'orange' },
  { value: 'OTHER', label: 'Outro', icon: '✨', color: 'gray' }
];

export default function FriendsPage() {
  const [invites, setInvites] = useState<InviteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Dados do formulário
  const [formData, setFormData] = useState({
    invitedName: '',
    relationshipType: 'FRIEND',
    customMessage: '',
    expiresInDays: 7
  });

  // Carregar convites
  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      const response = await fetch('/api/friends/invite', {
        headers: {
          'x-user-id': 'temp-user-id' // TODO: pegar do contexto de auth
        }
      });
      const result = await response.json();

      if (result.success) {
        setInvites(result.data.invites);
      }
    } catch (error) {
      console.error('Erro ao carregar convites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.invitedName.trim()) {
      return;
    }

    setCreating(true);

    try {
      const response = await fetch('/api/friends/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'temp-user-id' // TODO: pegar do contexto de auth
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setInvites(prev => [result.data.invite, ...prev]);
        setShowCreateModal(false);
        setFormData({
          invitedName: '',
          relationshipType: 'FRIEND',
          customMessage: '',
          expiresInDays: 7
        });
      }
    } catch (error) {
      console.error('Erro ao criar convite:', error);
    } finally {
      setCreating(false);
    }
  };

  const copyInviteCode = async (code: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const shareInvite = async (invite: InviteData) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Convite para ${invite.invitedName}`,
          text: `Descubra nossa compatibilidade numerológica! ${invite.customMessage || ''}`,
          url: invite.inviteUrl
        });
      } catch (error) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      copyInviteCode(invite.code, invite.inviteUrl);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-50';
      case 'ACCEPTED': return 'text-green-600 bg-green-50';
      case 'EXPIRED': return 'text-gray-600 bg-gray-50';
      case 'BLOCKED': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendente';
      case 'ACCEPTED': return 'Aceito';
      case 'EXPIRED': return 'Expirado';
      case 'BLOCKED': return 'Bloqueado';
      default: return status;
    }
  };

  const getRelationshipOption = (type: string) => {
    return relationshipOptions.find(opt => opt.value === type) || relationshipOptions[0];
  };

  return (
    <AppLayout title="Amigos & Convites">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Conexões Numerológicas
                </h2>
                <p className="text-gray-700 mb-4">
                  Convide pessoas especiais e descubra a compatibilidade numerológica entre vocês
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Lista de Convites */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Gift className="w-5 h-5 mr-2 text-purple-500" />
                Seus Convites ({invites.length})
              </h3>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-2 text-gray-600">Carregando...</span>
                </div>
              ) : invites.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Você ainda não criou nenhum convite</p>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    variant="outline"
                    size="sm"
                  >
                    Criar Primeiro Convite
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {invites.map((invite, index) => {
                    const relationship = getRelationshipOption(invite.relationshipType);
                    return (
                      <motion.div
                        key={invite.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{relationship.icon}</div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {invite.invitedName}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {relationship.label}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invite.status)}`}>
                              {getStatusText(invite.status)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <Eye className="w-4 h-4 mr-1" />
                              {invite.clicks} visualizações
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {new Date(invite.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => copyInviteCode(invite.code, invite.inviteUrl)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              {copiedCode === invite.code ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              onClick={() => shareInvite(invite)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {invite.customMessage && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                            "{invite.customMessage}"
                          </div>
                        )}

                        {invite.status === 'ACCEPTED' && invite.isRevealed && (
                          <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-purple-700">
                                🎉 Mapa de Compatibilidade Revelado!
                              </span>
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
                              >
                                Ver Mapa
                              </Button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recursos Futuros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
                Próximos Recursos
              </h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg opacity-75">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Oráculo Combinado</h3>
                  <p className="text-sm text-gray-700">Revelações místicas únicas para duplas</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg opacity-75">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Chat em Grupo</h3>
                  <p className="text-sm text-gray-700">Converse com seus amigos numerológicos</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg opacity-75">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Análise de Relacionamentos</h3>
                  <p className="text-sm text-gray-700">Insights profundos sobre suas conexões</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center text-sm text-gray-500 py-4"
        >
          <p>💫 As melhores conexões começam com os números 💫</p>
        </motion.div>
      </div>

      {/* Modal de Criação de Convite */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Criar Convite"
      >
        <form onSubmit={handleCreateInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da pessoa
            </label>
            <Input
              placeholder="Ex: Maria, João, etc."
              value={formData.invitedName}
              onChange={(value) => setFormData(prev => ({ ...prev, invitedName: value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de relacionamento
            </label>
            <select 
              value={formData.relationshipType}
              onChange={(e) => setFormData(prev => ({ ...prev, relationshipType: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {relationshipOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensagem personalizada (opcional)
            </label>
            <textarea
              placeholder="Ex: Vamos descobrir nossa compatibilidade numerológica!"
              value={formData.customMessage}
              onChange={(e) => setFormData(prev => ({ ...prev, customMessage: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Convite expira em
            </label>
            <select 
              value={formData.expiresInDays}
              onChange={(e) => setFormData(prev => ({ ...prev, expiresInDays: parseInt(e.target.value) }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value={1}>1 dia</option>
              <option value={3}>3 dias</option>
              <option value={7}>1 semana</option>
              <option value={30}>1 mês</option>
              <option value={0}>Nunca</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={creating}
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
            >
              Criar Convite
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
