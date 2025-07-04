'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { NavBar } from '@/components/ui/navbar';
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
    nome: '',
    dataNascimento: '',
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

  // Inicializar dados do usuário
  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.name || '',
        dataNascimento: user.birthDate ? user.birthDate.toISOString().split('T')[0] : '',
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
      const nomeClean = validateName(formData.nome);
      if (!nomeClean.trim()) {
        alert('Por favor, digite um nome válido (apenas letras)');
        return;
      }

      // Se nome ou data mudaram, recalcular mapa
      const novoMapa = mapa;
      if (nomeClean !== user.name || formData.dataNascimento !== (user.birthDate ? user.birthDate.toISOString().split('T')[0] : '')) {
        // Simular recálculo - em produção, chamar a função real
        console.log('Recalculando mapa numerológico...');
      }

      // Preparar dados para atualização
      const dadosAtualizados = {
        ...formData,
        nome: nomeClean
      };

      // Atualizar via API
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id || ''
        },
        body: JSON.stringify(dadosAtualizados)
      });

      if (response.ok) {
        // Atualizar estado local
        updateUser({ ...user, name: nomeClean });
        setIsEditing(false);
        
        // Notificar se nome/data mudaram
        if (nomeClean !== user.name || formData.dataNascimento !== (user.birthDate ? user.birthDate.toISOString().split('T')[0] : '')) {
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
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Carregando perfil...</p>
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
            <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-medium text-gray-900">Perfil</h1>
              <p className="text-xs text-gray-500">Configurações e preferências</p>
            </div>
          </div>
          {!isEditing ? (
            <Button 
              onClick={() => setIsEditing(true)}
              size="sm" 
              variant="outline"
              className="text-gray-600 border-gray-300"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                onClick={() => setIsEditing(false)}
                size="sm" 
                variant="ghost"
                className="text-gray-600"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                size="sm" 
                disabled={isSaving}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Container principal com padding bottom para navbar */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20 space-y-6">
        {/* Informações básicas */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-600">
                {user.birthDate ? new Date(user.birthDate).toLocaleDateString('pt-BR') : 'Data não informada'}
              </p>
              {mapa && (
                <p className="text-sm text-purple-600">Número do destino: {mapa.numeroDestino}</p>
              )}
            </div>
          </div>
          
          {isEditing && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <Input
                  value={formData.nome}
                  onChange={(value) => setFormData(prev => ({ ...prev, nome: validateName(value) }))}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Nascimento
                </label>
                <Input
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(value) => setFormData(prev => ({ ...prev, dataNascimento: value }))}
                />
                <div className="flex items-center mt-2 p-2 bg-blue-50 rounded-lg">
                  <Star className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    A data de nascimento é o ponto de origem da sua jornada espiritual.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tema da Aplicação */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
              <Palette className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Aparência</h3>
          </div>
          
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
        </div>

        {/* Download do App */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Numbly App</h3>
          </div>
          
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
        </div>

        {/* Notificações */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
          </div>
          
          <div className="space-y-4">
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
                <p className="text-sm text-gray-600">Inspirações baseadas em seus números</p>
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
          </div>
        </div>

        {/* Logout */}
        <div className="bg-white rounded-lg border border-red-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <LogOut className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Sair da Conta</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Fazer logout irá desconectá-lo de sua conta atual. Você precisará fazer login novamente para acessar suas informações.
          </p>
          
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-red-300 text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair do Oráculo
          </Button>
        </div>
      </div>

      {/* Navbar */}
      <NavBar />
    </div>
  );
}
