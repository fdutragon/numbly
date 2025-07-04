'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { NavBar } from '@/components/ui/navbar';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  User, 
  Calendar, 
  Star, 
  Crown, 
  Settings, 
  Edit2, 
  Save, 
  Volume2, 
  Play, 
  Moon,
  Sun,
  Palette,
  AlertTriangle,
  Sparkles,
  Bell,
  Heart,
  LogOut,
  Download,
  Smartphone,
  Monitor
} from 'lucide-react';

// Opções de relacionamento e preferências
const toqueOptions = [
  { value: 'tibetan', label: '🎵 Taças Tibetanas', preview: '/sounds/tibetan.mp3' },
  { value: 'bells', label: '🔔 Sinos Cristalinos', preview: '/sounds/bells.mp3' },
  { value: 'binaural', label: '🌊 Notas Binaurais', preview: '/sounds/binaural.mp3' },
  { value: 'nature', label: '🌿 Sons da Natureza', preview: '/sounds/nature.mp3' },
  { value: 'mystic', label: '✨ Vibração Mística', preview: '/sounds/mystic.mp3' }
];

const estiloLeituraOptions = [
  { value: 'espiritual', label: '🌌 Espiritual Elevado', description: 'Metafísico e simbólico' },
  { value: 'pragmatico', label: '🧠 Pragmático Consciente', description: 'Ação direta e objetiva' },
  { value: 'poetico', label: '🎭 Poético Profundo', description: 'Estilo oráculo místico' }
];

const avatarOptions = [
  { value: 'lobo', label: '🐺 Lobo', description: 'Liderança e intuição' },
  { value: 'fenix', label: '🔥 Fênix', description: 'Renascimento e transformação' },
  { value: 'curador', label: '🌿 Curador', description: 'Cura e sabedoria' },
  { value: 'alquimista', label: '⚗️ Alquimista', description: 'Transmutação e conhecimento' },
  { value: 'oraculo', label: '🔮 Oráculo', description: 'Visão e profecia' },
  { value: 'guardiao', label: '🛡️ Guardião', description: 'Proteção e força' }
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, mapa, logout, requireAuth, updateUser } = useAuth();
  
  // Estados para edição
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [currentSound, setCurrentSound] = useState<HTMLAudioElement | null>(null);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    apelidoEspiritual: '',
    toqueNotificacao: 'tibetan',
    estiloLeitura: 'espiritual',
    avatar: 'oraculo',
    mensagensDiarias: true,
    frasesMotivacionais: true,
    modoIntrospecao: false
  });

  // Estado para tema
  const [tema, setTema] = useState<'claro' | 'escuro' | 'sistema'>('sistema');

  // PWA States
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Proteger rota
  requireAuth();

  // Função auxiliar para converter data para string do input
  const formatDateForInput = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    
    try {
      if (typeof date === 'string') {
        // Se já é string, extrair apenas a parte da data (YYYY-MM-DD)
        return date.includes('T') ? date.split('T')[0] : date;
      }
      
      // Se é um objeto Date
      return new Date(date).toISOString().split('T')[0];
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '';
    }
  };

  // Inicializar dados do usuário
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        birthDate: formatDateForInput(user.birthDate),
        apelidoEspiritual: '',
        toqueNotificacao: 'tibetan',
        estiloLeitura: 'espiritual',
        avatar: 'oraculo',
        mensagensDiarias: true,
        frasesMotivacionais: true,
        modoIntrospecao: false
      });
      
      // Inicializar tema
      const temaArmazenado = localStorage.getItem('tema-numbly') as 'claro' | 'escuro' | 'sistema' || 'sistema';
      setTema(temaArmazenado);
      aplicarTema(temaArmazenado);
    }
  }, [user]);

  // PWA Detection
  useEffect(() => {
    // Verificar se PWA está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    setIsPWAInstalled(isStandalone || isInWebAppiOS);

    // Listener para evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Função para aplicar tema
  const aplicarTema = (novoTema: 'claro' | 'escuro' | 'sistema') => {
    const root = document.documentElement;
    
    if (novoTema === 'sistema') {
      // Usar preferência do sistema
      const prefereSistemaEscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefereSistemaEscuro);
    } else if (novoTema === 'escuro') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    localStorage.setItem('tema-numbly', novoTema);
    setTema(novoTema);
  };

  // Instalar PWA
  const instalarApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setIsPWAInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  // Validar nome sem acentos
  const validateName = (name: string) => {
    const cleanName = name.replace(/[^a-zA-Z\s]/g, '');
    return cleanName;
  };

  // Tocar preview do som
  const playSound = (soundPath: string) => {
    if (currentSound) {
      currentSound.pause();
    }
    
    const audio = new Audio(soundPath);
    audio.volume = 0.5;
    audio.play().catch(() => {
      console.log('Não foi possível reproduzir o som');
    });
    setCurrentSound(audio);
  };

  // Salvar alterações
  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    
    try {
      // Validar nome
      const nomeClean = validateName(formData.name);
      if (!nomeClean.trim()) {
        alert('Por favor, digite um nome válido (apenas letras)');
        return;
      }

      // Se nome ou data mudaram, recalcular mapa
      const novoMapa = mapa;
      const currentBirthDate = formatDateForInput(user.birthDate);
      if (nomeClean !== user.name || formData.birthDate !== currentBirthDate) {
        // Simular recálculo - em produção, chamar a função real
        console.log('Recalculando mapa numerológico...');
      }

      // Preparar dados para atualização
      const dadosAtualizados = {
        name: nomeClean,
        birthDate: new Date(formData.birthDate),
        // Outras propriedades mantidas do user original
        id: user.id,
        email: user.email,
        isPremium: user.isPremium,
        credits: user.credits,
        profileImage: user.profileImage,
        bio: user.bio,
        numerologyData: user.numerologyData,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        hasSeenIntro: user.hasSeenIntro
      };

      // Atualizar via API
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id || ''
        },
        body: JSON.stringify({
          name: nomeClean,
          birthDate: formData.birthDate
        })
      });

      if (response.ok) {
        // Atualizar estado local
        updateUser(dadosAtualizados);
        setIsEditing(false);
        
        // Notificar se nome/data mudaram
        if (nomeClean !== user.name || formData.birthDate !== currentBirthDate) {
          alert('✨ Seu mapa numerológico foi recalculado com as novas informações!');
        }
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro ao salvar as alterações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      logout();
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (!user || !mapa) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header fixo */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Perfil</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="ghost"
                size="sm"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="ghost"
                  size="sm"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 space-y-6 py-8 pb-20">{/* pb-20 for navbar space */}
        {/* Intro minimalista */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {user.name ? `Olá, ${user.name.split(' ')[0]}` : 'Meu Perfil'}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Personalize sua experiência no universo numerológico.
          </p>
        </motion.div>

        {/* Formulário de Edição */}
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold flex items-center text-gray-900">
                  <Settings className="w-5 h-5 mr-2 text-purple-500" />
                  Configurações Pessoais
                </h2>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(value) => setFormData(prev => ({ ...prev, name: validateName(value) }))}
                    placeholder="Seu nome completo"
                  />
                  <div className="flex items-center mt-2 p-2 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2 flex-shrink-0" />
                    <p className="text-xs text-yellow-700">
                      Alterar seu nome afetará a leitura do seu mapa numerológico.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Nascimento
                  </label>
                  <DateInput
                    value={formData.birthDate}
                    onChange={(value) => setFormData(prev => ({ ...prev, birthDate: value }))}
                  />
                  <div className="flex items-center mt-2 p-2 bg-blue-50 rounded-lg">
                    <Star className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                    <p className="text-xs text-blue-700">
                      A data de nascimento é o ponto de origem da sua jornada espiritual.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Como o Oráculo deve te chamar?
                  </label>
                  <Input
                    value={formData.apelidoEspiritual}
                    onChange={(value) => setFormData(prev => ({ ...prev, apelidoEspiritual: value }))}
                    placeholder="Ex: Alma Viajante, Guardião 7, Filho do Vento..."
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Usado nas mensagens push e textos personalizados
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seu Arquétipo Espiritual
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {avatarOptions.map((avatar) => (
                      <div
                        key={avatar.value}
                        onClick={() => setFormData(prev => ({ ...prev, avatar: avatar.value }))}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.avatar === avatar.value
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">{avatar.label.split(' ')[0]}</div>
                          <div className="font-medium text-sm text-gray-900">
                            {avatar.label.split(' ')[1]}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {avatar.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tema da Aplicação */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center text-gray-900">
                <Palette className="w-5 h-5 mr-2 text-indigo-500" />
                Aparência
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div
                  onClick={() => aplicarTema('sistema')}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                    tema === 'sistema'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Monitor className="w-5 h-5 text-gray-600" />
                    <div>
                      <span className="font-medium text-gray-900">Sistema</span>
                      <p className="text-sm text-gray-600">Seguir configuração do dispositivo</p>
                    </div>
                  </div>
                  {tema === 'sistema' && (
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  )}
                </div>

                <div
                  onClick={() => aplicarTema('claro')}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                    tema === 'claro'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Sun className="w-5 h-5 text-yellow-500" />
                    <div>
                      <span className="font-medium text-gray-900">Claro</span>
                      <p className="text-sm text-gray-600">Tema luminoso para o dia</p>
                    </div>
                  </div>
                  {tema === 'claro' && (
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  )}
                </div>

                <div
                  onClick={() => aplicarTema('escuro')}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                    tema === 'escuro'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Moon className="w-5 h-5 text-indigo-500" />
                    <div>
                      <span className="font-medium text-gray-900">Escuro</span>
                      <p className="text-sm text-gray-600">Tema suave para meditação</p>
                    </div>
                  </div>
                  {tema === 'escuro' && (
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Download do App */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center text-gray-900">
                <Smartphone className="w-5 h-5 mr-2 text-purple-500" />
                Numbly App
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              {isPWAInstalled ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">App Instalado! ✨</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    O Numbly já está instalado no seu dispositivo. Acesse-o diretamente pela tela inicial.
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-purple-600">
                    <Sparkles className="w-4 h-4" />
                    <span>Experiência offline disponível</span>
                  </div>
                </div>
              ) : isInstallable ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Download className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Instalar Aplicativo</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Adicione o Numbly à sua tela inicial para acesso rápido sem precisar abrir o navegador.
                  </p>
                  <Button
                    onClick={instalarApp}
                    className="bg-gradient-to-r from-purple-500 to-blue-600 w-full mb-3"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Instalar App
                  </Button>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>✓ Funciona offline</p>
                    <p>✓ Notificações push</p>
                    <p>✓ Experiência nativa</p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Smartphone className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">App Web Avançado</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Você já está usando a versão mais avançada do Numbly. Todas as funcionalidades estão disponíveis aqui mesmo!
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>✓ Sem downloads necessários</p>
                    <p>✓ Sempre atualizado</p>
                    <p>✓ Acesso instantâneo</p>
                  </div>
                </div>
              )}
              
              <div className="border-t pt-4">
                <p className="text-xs text-gray-600 text-center mb-3">
                  💡 <strong>Dica:</strong> Adicione um atalho no seu telefone para acesso ainda mais rápido
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/60 p-2 rounded-lg">
                    <strong>iOS:</strong> Safari → Compartilhar → Tela de Início
                  </div>
                  <div className="bg-white/60 p-2 rounded-lg">
                    <strong>Android:</strong> Chrome → Menu → Instalar app
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Preferências de Som */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center text-gray-900">
                <Volume2 className="w-5 h-5 mr-2 text-blue-500" />
                Toque do Oráculo
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {toqueOptions.map((toque) => (
                  <div
                    key={toque.value}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.toqueNotificacao === toque.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, toqueNotificacao: toque.value }))}
                  >
                    <span className="font-medium text-gray-900">{toque.label}</span>
                    <Button
                      onClick={() => playSound(toque.preview)}
                      variant="ghost"
                      size="sm"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Estilo de Leitura */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center text-gray-900">
                <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
                Estilo de Leitura Preferido
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {estiloLeituraOptions.map((estilo) => (
                  <div
                    key={estilo.value}
                    onClick={() => setFormData(prev => ({ ...prev, estiloLeitura: estilo.value }))}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.estiloLeitura === estilo.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900 mb-1">
                      {estilo.label}
                    </div>
                    <div className="text-sm text-gray-600">
                      {estilo.description}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-3">
                A IA adapta automaticamente o tom das respostas e artigos
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Preferências de Mensagens */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center text-gray-900">
                <Bell className="w-5 h-5 mr-2 text-green-500" />
                Mensagens do Oráculo
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Mensagens Diárias</h4>
                  <p className="text-sm text-gray-600">Insights e previsões numerológicas</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.mensagensDiarias}
                    onChange={(e) => setFormData(prev => ({ ...prev, mensagensDiarias: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Frases Motivacionais</h4>
                  <p className="text-sm text-gray-600">Lembretes inspiradores (manhã/tarde)</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.frasesMotivacionais}
                    onChange={(e) => setFormData(prev => ({ ...prev, frasesMotivacionais: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Modo Introspecção</h4>
                  <p className="text-sm text-gray-600">Silenciar por 24h</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.modoIntrospecao}
                    onChange={(e) => setFormData(prev => ({ ...prev, modoIntrospecao: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-red-200">
            <CardContent className="p-4">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair do Oráculo
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <div className="text-center text-sm text-gray-500 py-4">
          <p>🔮 Configure sua conexão com o universo numerológico 🔮</p>
        </div>
      </div>
      
      {/* Navbar */}
      <NavBar />
    </div>
  );
}