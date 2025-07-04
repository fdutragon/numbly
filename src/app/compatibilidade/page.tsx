'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { 
  Heart, 
  ArrowLeft, 
  Share2,
  Sparkles,
  MessageCircle,
  DollarSign,
  Users,
  Star,
  Crown,
  Send,
  Calculator
} from 'lucide-react';
import { NavBar } from '@/components/ui/navbar';
import Link from 'next/link';
import { calcularCompatibilidade } from '@/lib/numerologia';
import { validateDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface CompatibilityResult {
  score: number;
  areas: {
    amor: number;
    comunicacao: number;
    financas: number;
    familia: number;
  };
  descricao: string;
  sugestoes: string[];
}

export default function CompatibilidadePage() {
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  
  // Proteger rota
  requireAuth();
  
  const [formData, setFormData] = useState({
    nome: '',
    dataNascimento: '',
  });
  const [errors, setErrors] = useState<{ nome?: string; dataNascimento?: string }>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const validateForm = () => {
    const newErrors: { nome?: string; dataNascimento?: string } = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    if (!formData.dataNascimento) {
      newErrors.dataNascimento = 'Data de nascimento é obrigatória';
    } else if (!validateDate(formData.dataNascimento)) {
      newErrors.dataNascimento = 'Data inválida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (!user?.isPremium) {
        setShowPremiumModal(true);
        return;
      }

      const compatibility = calcularCompatibilidade(
        {
          nome: user.name || '',
          dataNascimento: user.birthDate ? user.birthDate.toISOString().split('T')[0] : ''
        },
        {
          nome: formData.nome,
          dataNascimento: formData.dataNascimento
        }
      );
      
      setResult(compatibility);
    } catch (error) {
      console.error('Erro ao calcular compatibilidade:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ nome: '', dataNascimento: '' });
    setResult(null);
    setErrors({});
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    if (score >= 40) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-red-600';
  };

  const getScoreText = (score: number) => {
    if (score >= 80) return 'Excelente Compatibilidade';
    if (score >= 60) return 'Boa Compatibilidade';
    if (score >= 40) return 'Compatibilidade Moderada';
    return 'Compatibilidade Baixa';
  };

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Calculando compatibilidade...</p>
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
            <Link href="/dashboard">
              <button className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
            </Link>
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-medium text-gray-900">Compatibilidade</h1>
              <p className="text-xs text-gray-500">Descubra a afinidade numerológica</p>
            </div>
          </div>
          {!user?.isPremium && (
            <Button
              size="sm"
              onClick={() => setShowPremiumModal(true)}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
            >
              <Crown className="w-4 h-4 mr-2" />
              Premium
            </Button>
          )}
        </div>
      </div>

      {/* Container principal com padding bottom para navbar */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
        {!result ? (
          /* Formulário */
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Compatibilidade Numerológica</h2>
              <p className="text-gray-600">
                Descubra o nível de afinidade entre você e outra pessoa através da numerologia
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Seus dados</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-600">
                    {user?.birthDate ? new Date(user.birthDate).toLocaleDateString('pt-BR') : 'Data não informada'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da outra pessoa
                  </label>
                  <Input
                    type="text"
                    placeholder="Digite o nome completo..."
                    value={formData.nome}
                    onChange={(value) => setFormData(prev => ({ ...prev, nome: value }))}
                    className={errors.nome ? 'border-red-300' : ''}
                  />
                  {errors.nome && (
                    <p className="text-sm text-red-600 mt-1">{errors.nome}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de nascimento
                  </label>
                  <Input
                    type="date"
                    value={formData.dataNascimento}
                    onChange={(value) => setFormData(prev => ({ ...prev, dataNascimento: value }))}
                    className={errors.dataNascimento ? 'border-red-300' : ''}
                  />
                  {errors.dataNascimento && (
                    <p className="text-sm text-red-600 mt-1">{errors.dataNascimento}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Calculando...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Calcular Compatibilidade
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        ) : (
          /* Resultado */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Score principal */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
              <div className={`w-24 h-24 bg-gradient-to-br ${getScoreColor(result.score)} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <span className="text-2xl font-bold text-white">{result.score}%</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{getScoreText(result.score)}</h2>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
                <span>{user?.name}</span>
                <Heart className="w-4 h-4 text-pink-500" />
                <span>{formData.nome}</span>
              </div>
              <p className="text-gray-700 leading-relaxed">{result.descricao}</p>
            </div>

            {/* Áreas detalhadas */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Análise por Áreas</h3>
              <div className="space-y-4">
                {Object.entries(result.areas).map(([area, score]) => {
                  const areaNames = {
                    amor: 'Amor & Romance',
                    comunicacao: 'Comunicação',
                    financas: 'Finanças',
                    familia: 'Família'
                  };
                  
                  return (
                    <div key={area} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {areaNames[area as keyof typeof areaNames]}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${getScoreColor(score)} transition-all duration-500`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">{score}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sugestões */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sugestões para o Relacionamento</h3>
              <div className="space-y-3">
                {result.sugestoes.map((sugestao, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Star className="w-3 h-3 text-purple-600" />
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{sugestao}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-3">
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1"
              >
                Nova Análise
              </Button>
              <Button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Compatibilidade Numerológica',
                      text: `${user?.name} e ${formData.nome} têm ${result.score}% de compatibilidade!`,
                      url: window.location.href
                    });
                  }
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Premium Modal */}
      <Modal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        title="Recurso Premium"
        size="md"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-xl font-semibold mb-4">
            Análise de Compatibilidade Premium
          </h3>
          
          <p className="text-gray-600 mb-8">
            Para acessar a análise completa de compatibilidade numerológica, 
            você precisa do plano Premium.
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
