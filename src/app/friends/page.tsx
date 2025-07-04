'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
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
import { NavBar } from '@/components/ui/navbar';

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

  const getRelationshipConfig = (type: string) => {
    return relationshipOptions.find(opt => opt.value === type) || relationshipOptions[0];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-50';
      case 'ACCEPTED': return 'text-green-600 bg-green-50';
      case 'EXPIRED': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendente';
      case 'ACCEPTED': return 'Aceito';
      case 'EXPIRED': return 'Expirado';
      default: return 'Desconhecido';
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Carregando amigos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header minimalista */}
      <div className="border-b border-gray-100 px-4 py-4 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-medium text-gray-900">Amigos</h1>
              <p className="text-xs text-gray-500">Conecte-se com outras pessoas</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Convidar
          </Button>
        </div>
      </div>

      {/* Container principal com padding bottom para navbar */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20 space-y-6">
        {/* Empty state ou lista de convites */}
        {invites.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Nenhum convite ainda</h2>
            <p className="text-gray-600 mb-6">Convide amigos para descobrir a compatibilidade numerológica entre vocês!</p>
            <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Criar Primeiro Convite
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {invites.map((invite) => {
              const config = getRelationshipConfig(invite.relationshipType);
              
              return (
                <motion.div
                  key={invite.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 bg-gradient-to-br from-${config.color}-500 to-${config.color}-600 rounded-full flex items-center justify-center text-2xl`}>
                        {config.icon}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{invite.invitedName}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invite.status)}`}>
                            {getStatusText(invite.status)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{config.label}</p>
                        
                        {invite.customMessage && (
                          <p className="text-sm text-gray-700 italic mb-2">"{invite.customMessage}"</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {invite.clicks} visualizações
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(invite.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {invite.status === 'ACCEPTED' && invite.isRevealed && (
                        <Button size="sm" variant="outline" className="text-purple-600 border-purple-200">
                          <Heart className="w-4 h-4 mr-1" />
                          Ver Compatibilidade
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyInviteCode(invite.code, invite.inviteUrl)}
                        className="relative"
                      >
                        {copiedCode === invite.code ? (
                          <>
                            <Check className="w-4 h-4 mr-1 text-green-600" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            Copiar Link
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => shareInvite(invite)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Share2 className="w-4 h-4 mr-1" />
                        Compartilhar
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de criar convite */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Convidar Pessoa"
        size="md"
      >
        <form onSubmit={handleCreateInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da pessoa
            </label>
            <Input
              type="text"
              placeholder="Digite o nome..."
              value={formData.invitedName}
              onChange={(value) => setFormData(prev => ({...prev, invitedName: value}))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de relacionamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              {relationshipOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, relationshipType: option.value}))}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    formData.relationshipType === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{option.icon}</span>
                    <span className="text-sm font-medium">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensagem personalizada (opcional)
            </label>
            <Input
              type="text"
              placeholder="Ex: Quero saber nossa compatibilidade!"
              value={formData.customMessage}
              onChange={(value) => setFormData(prev => ({...prev, customMessage: value}))}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={creating || !formData.invitedName.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Criar Convite
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Navbar */}
      <NavBar />
    </div>
  );
}
