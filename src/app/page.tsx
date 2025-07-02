'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Bell, Gift, Shield, Zap } from 'lucide-react';
import { useUserStore } from '@/lib/stores/user-store';
import { calcularNumeroDestino, gerarMapaNumerologico } from '@/lib/numerologia';
import { validateDate } from '@/lib/utils';
import { pushService } from '@/lib/push';
import { useRouter } from 'next/navigation';
import { useAuth, useRedirectIfAuthenticated } from '@/hooks/useAuth';

export default function Home() {
  const router = useRouter();
  const { setUser, setMapa } = useUserStore();
  
  // Redireciona usuário autenticado para dashboard
  useRedirectIfAuthenticated();
  
  const [formData, setFormData] = useState({
    nome: '',
    dataNascimento: '',
  });
  
  const [errors, setErrors] = useState<{ nome?: string; dataNascimento?: string }>({});
  const [loading, setLoading] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    } else if (formData.nome.trim().length < 2) {
      newErrors.nome = 'Nome deve ter pelo menos 2 caracteres';
    }
    
    if (!formData.dataNascimento) {
      newErrors.dataNascimento = 'Data de nascimento é obrigatória';
    } else if (!validateDate(formData.dataNascimento)) {
      newErrors.dataNascimento = 'Data inválida ou futura';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const numeroDestino = calcularNumeroDestino(formData.dataNascimento);
      const mapa = gerarMapaNumerologico(formData.nome, formData.dataNascimento);
      
      const userData = {
        nome: formData.nome.trim(),
        dataNascimento: formData.dataNascimento,
        numeroDestino,
        plano: 'gratuito' as const,
        pushEnabled: false,
      };
      
      // Salvar localmente primeiro
      setUser(userData);
      setMapa(mapa);
      
      // Mostrar modal de notificações
      setRegistrationComplete(true);
      setShowNotificationModal(true);
      
    } catch (error) {
      console.error('Erro no registro:', error);
      setErrors({ nome: 'Erro interno. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSetup = async (enableNotifications: boolean) => {
    try {
      if (enableNotifications) {
        const hasPermission = await pushService.requestPermission();
        if (hasPermission) {
          await pushService.subscribeToPush();
          useUserStore.getState().updateUser({ pushEnabled: true });
        }
      }
      
      setShowNotificationModal(false);
      router.push('/dashboard');
    } catch (error) {
      console.error('Erro ao configurar notificações:', error);
      // Mesmo com erro, continua para o dashboard
      setShowNotificationModal(false);
      router.push('/dashboard');
    }
  };

  const notificationBenefits = [
    {
      icon: Zap,
      title: 'Insights Diários',
      description: 'Receba orientações numerológicas personalizadas'
    },
    {
      icon: Gift,
      title: 'Dicas Especiais',
      description: 'Conselhos exclusivos baseados no seu mapa'
    },
    {
      icon: Shield,
      title: 'Lembretes Importantes',
      description: 'Nunca perca momentos favoráveis para decisões'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Descubra seu
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              {' '}Destino
            </span>
          </h1>
          <p className="text-gray-600">
            Cadastre-se para descobrir seu mapa numerológico personalizado
          </p>
        </motion.div>

        {/* Form */}
        <Card className="shadow-lg border border-gray-200 bg-white/90">
          <CardHeader>
            <h2 className="text-xl font-semibold text-center text-gray-900">Dados Pessoais</h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-800 mb-1">Nome Completo</label>
              <Input
                placeholder="Digite seu nome completo"
                value={formData.nome}
                onChange={(value) => setFormData(prev => ({ ...prev, nome: value }))}
                error={errors.nome}
                required
                className="bg-white border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-gray-900 placeholder-gray-400 px-4 py-2 rounded-md shadow-sm w-full"
              />
              {errors.nome && <span className="text-xs text-red-600 mt-1 block">{errors.nome}</span>}
            </div>
            <div>
              <label htmlFor="dataNascimento" className="block text-sm font-medium text-gray-800 mb-1">Data de Nascimento</label>
              <Input
                type="date"
                value={formData.dataNascimento}
                onChange={(value) => setFormData(prev => ({ ...prev, dataNascimento: value }))}
                error={errors.dataNascimento}
                required
                className="bg-white border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-gray-900 placeholder-gray-400 px-4 py-2 rounded-md shadow-sm w-full"
              />
              {errors.dataNascimento && <span className="text-xs text-red-600 mt-1 block">{errors.dataNascimento}</span>}
            </div>
            <Button
              onClick={handleSubmit}
              loading={loading}
              disabled={!formData.nome.trim() || !formData.dataNascimento}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-md shadow-md transition"
            >
              Gerar Meu Mapa
            </Button>
          </CardContent>
        </Card>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center text-sm text-gray-600"
        >
          <p>
            Seus dados são usados apenas para calcular seu mapa numerológico.
            <br />
            Não compartilhamos informações pessoais com terceiros.
          </p>
        </motion.div>
      </div>

      {/* Notification Setup Modal */}
      <Modal
        isOpen={showNotificationModal}
        onClose={() => {}}
        title="Ativar Notificações"
        size="md"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bell className="w-8 h-8 text-purple-600" />
          </div>
          
          <h3 className="text-xl font-semibold mb-4">
            Potencialize sua Experiência
          </h3>
          
          <p className="text-gray-600 mb-8">
            Ative as notificações para receber insights personalizados baseados no seu mapa numerológico.
          </p>
          
          <div className="space-y-4 mb-8">
            {notificationBenefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start text-left"
              >
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <benefit.icon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{benefit.title}</h4>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="space-y-3">
            <Button
              onClick={() => handleNotificationSetup(true)}
              className="w-full"
            >
              Ativar Notificações
            </Button>
            <Button
              onClick={() => handleNotificationSetup(false)}
              variant="ghost"
              className="w-full"
            >
              Continuar sem Notificações
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
