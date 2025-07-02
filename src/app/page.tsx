'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Bell, Gift, Shield, Zap } from 'lucide-react';
import { useUserStore } from '@/lib/stores/user-store';
import { calcularNumeroDestino, gerarMapaNumerologicoCompleto } from '@/lib/numerologia';
import { validateBrazilianDate as validateDate } from '@/lib/date-utils';
import { pushService } from '@/lib/push';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getOrCreateDeviceId } from '@/lib/device-id';

export default function Home() {
  const router = useRouter();
  const { setUser, setMapa } = useUserStore();
  
  // Função para validar data brasileira
  const isValidBrazilianDate = (date: string): boolean => {
    if (!date || !/^\d{2}\/\d{2}\/\d{4}$/.test(date)) return false;
    
    const [day, month, year] = date.split('/').map(Number);
    
    if (month < 1 || month > 12) return false;
    
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;
    
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month === 2 && ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0))) {
      daysInMonth[1] = 29;
    }
    
    if (day > daysInMonth[month - 1]) return false;
    
    const dateObj = new Date(year, month - 1, day);
    return dateObj <= new Date();
  };
  
  const [formData, setFormData] = useState({
    nome: '',
    dataNascimento: '',
  });
  
  const [errors, setErrors] = useState<{ nome?: string; dataNascimento?: string }>({});
  const [loading, setLoading] = useState(false);
  const [loadingDevice, setLoadingDevice] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [deviceMessage, setDeviceMessage] = useState('');

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    } else if (formData.nome.trim().length < 2) {
      newErrors.nome = 'Nome deve ter pelo menos 2 caracteres';
    }
    
    if (!formData.dataNascimento) {
      newErrors.dataNascimento = 'Data de nascimento é obrigatória';
    } else if (!isValidBrazilianDate(formData.dataNascimento)) {
      newErrors.dataNascimento = 'Data inválida ou futura';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('🔥 handleSubmit chamado!', { formData });
    if (!validateForm()) {
      console.log('❌ Validação falhou', errors);
      return;
    }
    setLoading(true);
    try {
      console.log('📊 Preparando dados para registro via push...');
      // 1. Gerar ou recuperar deviceId único (redundante e persistente)
      const deviceId = await getOrCreateDeviceId();
      // 2. Converter data brasileira (DD/MM/YYYY) para formato ISO (YYYY-MM-DD)
      const [day, month, year] = formData.dataNascimento.split('/');
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      // 3. Calcular número do destino para enviar para API
      const numeroDestino = calcularNumeroDestino(formData.dataNascimento);
      const registerData = {
        nome: formData.nome.trim(),
        dataNascimento: isoDate,
        numeroDestino,
        deviceId,
        userAgent: navigator.userAgent,
        platform: navigator.platform
      };
      console.log('🚀 Enviando dados para API de registro...', registerData);
      // 4. Chamar API de registro que salva no banco e gera token
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Erro na API:', result);
        throw new Error(result.error || result.details || 'Erro no registro');
      }
      
      console.log('✅ Usuário registrado com sucesso:', result);
      
      // 5. Atualizar store com dados do usuário
      setUser(result.user);
      if (result.user.numerologyData) {
        setMapa(result.user.numerologyData);
      }
      
      // 6. Tentar registrar push notification (opcional)
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          console.log('📱 Registrando Service Worker...');
          
          // Primeiro registrar e ativar o Service Worker
          const registration = await navigator.serviceWorker.register('/sw.js');
          await navigator.serviceWorker.ready;
          
          console.log('🔔 Solicitando permissão para push notifications...');
          const permission = await Notification.requestPermission();
          
          if (permission === 'granted') {
            console.log('✅ Permissão de push concedida');
            
            // Criar subscription
            const applicationServerKey = (window as any).NEXT_PUBLIC_VAPID_PUBLIC_KEY || undefined;
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey
            });
            
            // Salvar subscription no banco
            await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                subscription,
                deviceId,
                userAgent: navigator.userAgent
              })
            });
            
            console.log('📲 Push notification registrado com sucesso');
          } else {
            console.log('🚫 Permissão de push negada');
          }
        } catch (pushError) {
          console.warn('⚠️ Erro ao registrar push (não crítico):', pushError);
        }
      }
      
      // 7. Redirecionar para dashboard
      console.log('🎯 Redirecionando para dashboard...');
      router.push('/dashboard');
      
    } catch (error) {
      console.error('💥 Erro no registro:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro interno. Tente novamente.';
      setErrors({ nome: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleExistingDevice = async () => {
    setLoadingDevice(true);
    setDeviceMessage('');
    
    try {
      // 1. Garantir que temos um deviceId (gera se não existir)
      const deviceId = await getOrCreateDeviceId();
      console.log('[EXISTING_DEVICE] DeviceId:', deviceId);
      
      // 2. Verificar dispositivo na API
      console.log('[EXISTING_DEVICE] Chamando API check-device-push...');
      const response = await fetch('/api/auth/check-device-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      });
      
      console.log('[EXISTING_DEVICE] Resposta status:', response.status);
      const result = await response.json();
      console.log('[EXISTING_DEVICE] Resultado:', result);
      
      if (!result.success) {
        setDeviceMessage(result.message || 'Dispositivo não encontrado. Por favor, faça um novo cadastro.');
        return;
      }
      
      if (result.exists) {
        if (!result.hasPush) {
          setDeviceMessage(`Bem-vindo de volta ${result.userName}! Configure as notificações para continuar.`);
          setShowNotificationModal(true);
          return;
        }
        
        if (!result.pushSent) {
          setDeviceMessage('Erro ao enviar notificação. Tente novamente.');
          return;
        }
        
        setDeviceMessage('Notificação enviada! Clique no push para entrar.');
      } else {
        setDeviceMessage('Dispositivo não encontrado. Por favor, faça um novo cadastro.');
      }
      
    } catch (error) {
      console.error('[EXISTING_DEVICE] Erro:', error);
      setDeviceMessage('Erro ao verificar dispositivo. Tente novamente.');
    } finally {
      setLoadingDevice(false);
    }
  };

  const handleNotificationSetup = async (enableNotifications: boolean) => {
    try {
      if (enableNotifications) {
        console.log('🔔 Iniciando configuração de notificações...');
        
        // Solicitar permissão
        const hasPermission = await pushService.requestPermission();
        if (!hasPermission) {
          console.warn('⚠️ Permissão para notificações negada');
          throw new Error('Permissão para notificações foi negada');
        }
        
        console.log('✅ Permissão concedida');
        
        // Subscrever ao push
        const subscription = await pushService.subscribeToPush();
        if (!subscription) {
          console.error('❌ Falha ao criar subscription');
          throw new Error('Não foi possível criar subscription de push');
        }
        
        console.log('✅ Subscription criada:', subscription.endpoint);
        // Não atualiza mais pushEnabled no store, pois não existe no modelo User
      }
      
      setShowNotificationModal(false);
      router.push('/dashboard');
    } catch (error) {
      console.error('❌ Erro ao configurar notificações:', error);
      
      // Ajustei o tipo de `error` para garantir que `error.message` seja acessível.
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao configurar notificações: ${errorMessage}`);
      
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
    <div className="min-h-screen flex items-center justify-center px-2 py-6 bg-gradient-to-br from-gray-950 via-black to-gray-900 relative overflow-hidden">
      {/* Efeito de fundo: blobs/fluidos */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-purple-900 opacity-20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-900 opacity-10 rounded-full blur-2xl animate-pulse delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-1/3 h-1/3 bg-gradient-to-br from-black via-gray-900 to-purple-900 opacity-30 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
      </div>
      <div className="w-full max-w-md z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex justify-center mb-4 relative">
            <div className="absolute inset-0 flex items-center justify-center z-0">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-700 via-blue-700 to-transparent rounded-full blur-2xl opacity-60 animate-pulse-slow" />
            </div>
            <img src="/icon-128x128.svg" alt="Numbly Oráculo" className="w-16 h-16 relative z-10 shadow-2xl border-4 border-white/10 animate-float rounded-[10px]" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight drop-shadow-lg">
            Numbly Oráculo
          </h1>
          <h2 className="text-lg font-semibold text-purple-300 mb-1 tracking-tight max-w-md mx-auto w-full px-2">
            Sua Jornada Numerológica
          </h2>
          <p className="text-gray-300 text-base font-light max-w-lg mx-auto mb-3">
            Descubra o poder dos números na sua vida. Cadastre-se e receba um mapa numerológico personalizado, dicas e insights exclusivos.
          </p>
        </motion.div>
        {/* Form */}
        <Card className="shadow-2xl border border-gray-900/60 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950/90 backdrop-blur-lg transition-all duration-300 px-6 py-8">
          {/* CardHeader removido para limpar o visual */}
          <CardContent className="space-y-3 p-0">
            <div>
              <label htmlFor="nome" className="block text-sm font-semibold text-gray-200 mb-2">Nome Completo</label>
              <Input
                placeholder="Digite seu nome completo"
                value={formData.nome}
                onChange={(value) => setFormData(prev => ({ ...prev, nome: value }))}
                error={errors.nome}
                required
                className="bg-gray-900/80 border border-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-800 text-white placeholder-gray-500 px-4 py-3 rounded-md shadow-sm w-full text-base transition-all"
              />
              {errors.nome && <span className="text-xs text-red-400 mt-1 block">{errors.nome}</span>}
            </div>
            <div>
              <label htmlFor="dataNascimento" className="block text-sm font-semibold text-gray-200 mb-2">
                Data de Nascimento
              </label>
              <DateInput
                value={formData.dataNascimento}
                onChange={(value) => setFormData(prev => ({ ...prev, dataNascimento: value }))}
                error={errors.dataNascimento}
                required
                placeholder="DD/MM/AAAA"
                className="bg-gray-900/80 border border-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-800 text-white placeholder-gray-500 px-4 py-3 rounded-md shadow-sm w-full text-base transition-all"
              />
              {errors.dataNascimento && <span className="text-xs text-red-400 mt-1 block">{errors.dataNascimento}</span>}
              {formData.dataNascimento && (
                <span className="text-xs text-blue-400 mt-1 block">
                  ✓ Formato brasileiro: {formData.dataNascimento}
                </span>
              )}
            </div>
            <Button
              type="button"
              onClick={handleSubmit}
              loading={loading}
              disabled={!formData.nome.trim() || !formData.dataNascimento}
              className="w-full mt-2 bg-gradient-to-r from-purple-700 via-purple-800 to-blue-800 hover:from-purple-800 hover:to-blue-900 text-white font-semibold py-2 rounded-md shadow-md transition text-base"
            >
              Gerar Meu Mapa
            </Button>
            {/* Botão para login via dispositivo existente */}
            <Button
              type="button"
              onClick={handleExistingDevice}
              loading={loadingDevice}
              disabled={loading}
              variant="outline"
              className="w-full mt-2 border border-gray-700 text-gray-200 hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="text-gray-400"><path d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="currentColor"/></svg>
              Usar Dispositivo Existente
            </Button>
            {deviceMessage && (
              <p className="text-sm text-gray-300 mt-2 text-center">
                {deviceMessage}
              </p>
            )}
            {/* Call to action para baixar o app */}
            <div className="mt-2 flex flex-col items-center gap-1">
              <span className="text-sm text-gray-300 font-medium mb-1">Baixe nosso App <span className="text-purple-300 font-semibold">sem sair do site!</span></span>
              <div className="flex gap-3">
                <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700 shadow hover:from-purple-800 hover:to-blue-900 transition">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-green-400"><path d="M17.6 13.53c-.03-3.36 2.74-4.97 2.86-5.05-1.56-2.28-3.98-2.6-4.83-2.63-2.06-.21-4.02 1.2-5.07 1.2-1.05 0-2.67-1.17-4.4-1.13-2.26.03-4.34 1.32-5.5 3.36-2.36 4.09-.6 10.13 1.7 13.45 1.13 1.62 2.47 3.44 4.23 3.38 1.7-.07 2.34-1.09 4.39-1.09 2.05 0 2.62 1.09 4.4 1.06 1.82-.03 2.96-1.65 4.07-3.28 1.29-1.89 1.82-3.73 1.85-3.82-.04-.02-3.54-1.36-3.57-5.41z" fill="currentColor"/><path d="M15.45 3.98c.89-1.08 1.49-2.59 1.32-4.08-1.28.05-2.83.85-3.75 1.93-.82.97-1.54 2.52-1.27 4 .15.06 2.53.16 3.7-1.85z" fill="currentColor"/></svg>
                  <span className="text-xs text-gray-200 font-semibold">Android</span>
                </a>
                <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700 shadow hover:from-purple-800 hover:to-blue-900 transition">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-100"><path d="M16.365 1.43c0 1.14-.46 2.25-1.29 3.18-.82.92-2.16 1.63-3.36 1.53-.13-1.13.46-2.32 1.28-3.18C13.81 1.1 15.13.4 16.22.4c.09.34.14.7.14 1.03zm4.13 15.13c-.06-.13-5.44-2.66-5.5-7.93-.03-2.5 1.97-3.7 2.06-3.76-.98-1.43-2.5-1.63-3.04-1.65-1.3-.13-2.54.76-3.21.76-.67 0-1.7-.74-2.8-.72-1.44.02-2.77.84-3.5 2.13-1.5 2.6-.38 6.44 1.1 8.56.73 1.04 1.6 2.2 2.74 2.16 1.1-.04 1.52-.7 2.86-.7 1.34 0 1.7.7 2.86.68 1.18-.02 1.92-1.13 2.65-2.18.84-1.23 1.19-2.43 1.21-2.5zm-4.13-13.13c.01.34-.04.69-.13 1.03-1.09 0-2.41.7-3.36 1.53-.82.86-1.41 2.05-1.28 3.18 1.2.1 2.54-.61 3.36-1.53.83-.93 1.29-2.04 1.29-3.18z" fill="currentColor"/></svg>
                  <span className="text-xs text-gray-200 font-semibold">iOS</span>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-center text-xs text-gray-500"
        >
          <p>
            Seus dados são usados apenas para calcular seu mapa numerológico.
            <br />
            Não compartilhamos informações pessoais com terceiros.
          </p>
        </motion.div>
      </div>
      {/* Footer minimalista com logo pequeno e brilho */}
      {/* Rodapé agora sem logo, apenas brilho decorativo centralizado */}
      <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 flex justify-center items-center z-30">
        <span className="w-12 h-12 bg-gradient-to-br from-purple-700 via-blue-700 to-transparent rounded-full blur-md opacity-40 animate-pulse-slow" />
      </footer>
      {/* UI Elemento decorativo canto inferior direito */}
      <div className="fixed bottom-4 right-4 z-20">
        <div className="w-9 h-9 bg-gradient-to-br from-purple-700 to-blue-700 rounded-full shadow-lg flex items-center justify-center animate-spin-slow">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#fff" strokeOpacity=".2" strokeWidth="2" /><circle cx="12" cy="12" r="6" stroke="#fff" strokeOpacity=".4" strokeWidth="2" /></svg>
        </div>
      </div>

      {/* Modal de configuração de notificações */}
      <Modal
        isOpen={showNotificationModal}
        onClose={() => handleNotificationSetup(false)}
        title="Configurar Notificações"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Quer receber insights numerológicos?
            </h3>
            <p className="text-gray-600 mb-6">
              Permita notificações para receber orientações personalizadas baseadas no seu mapa numerológico.
            </p>
          </div>

          <div className="space-y-4">
            {notificationBenefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{benefit.title}</h4>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => handleNotificationSetup(false)}
              className="flex-1"
            >
              Agora não
            </Button>
            <Button
              onClick={() => handleNotificationSetup(true)}
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
            >
              Permitir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
