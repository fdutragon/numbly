'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
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
  Send
} from 'lucide-react';
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

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
    if (!user) {
      router.push('/register');
      return;
    }

    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const pessoa1 = {
        nome: user.nome,
        dataNascimento: user.dataNascimento
      };
      
      const pessoa2 = {
        nome: formData.nome.trim(),
        dataNascimento: formData.dataNascimento
      };
      
      const compatibilidade = calcularCompatibilidade(pessoa1, pessoa2);
      setResult(compatibilidade);
      
    } catch (error) {
      console.error('Erro ao calcular compatibilidade:', error);
      setErrors({ nome: 'Erro ao calcular compatibilidade. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 90) return 'from-green-500 to-green-600';
    if (score >= 80) return 'from-green-400 to-green-500';
    if (score >= 70) return 'from-yellow-400 to-yellow-500';
    if (score >= 60) return 'from-orange-400 to-orange-500';
    return 'from-red-400 to-red-500';
  };

  const getScoreDescription = (score: number) => {
    if (score >= 90) return 'Compatibilidade Extraordinária';
    if (score >= 80) return 'Ótima Compatibilidade';
    if (score >= 70) return 'Boa Compatibilidade';
    if (score >= 60) return 'Compatibilidade Moderada';
    return 'Compatibilidade Desafiadora';
  };

  const areaIcons = {
    amor: Heart,
    comunicacao: MessageCircle,
    financas: DollarSign,
    familia: Users
  };

  const areaNames = {
    amor: 'Amor',
    comunicacao: 'Comunicação',
    financas: 'Finanças',
    familia: 'Família'
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/dashboard" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Link>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Mapa de Compatibilidade
            </h1>
            <p className="text-gray-600">
              Descubra a sintonia numerológica entre você e alguém especial
            </p>
          </div>
        </motion.div>

        {!result ? (
          /* Form */
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-center">
                  Dados da Outra Pessoa
                </h2>
                <p className="text-sm text-gray-600 text-center">
                  Você: <span className="font-medium">{user.nome}</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <Input
                  label="Nome Completo"
                  placeholder="Digite o nome da pessoa"
                  value={formData.nome}
                  onChange={(value) => setFormData(prev => ({ ...prev, nome: value }))}
                  error={errors.nome}
                  required
                />
                
                <Input
                  label="Data de Nascimento"
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(value) => setFormData(prev => ({ ...prev, dataNascimento: value }))}
                  error={errors.dataNascimento}
                  required
                />
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={!formData.nome.trim() || !formData.dataNascimento}
                  className="w-full"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Calcular Compatibilidade
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ) : (
          /* Results */
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Main Score */}
            <Card className="text-center">
              <CardContent className="pt-8 pb-8">
                <div className="mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.8, delay: 0.2 }}
                    className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-br ${getScoreGradient(result.score)} flex items-center justify-center mb-4`}
                  >
                    <span className="text-4xl font-bold text-white">
                      {result.score}%
                    </span>
                  </motion.div>
                  <h3 className={`text-2xl font-bold ${getScoreColor(result.score)} mb-2`}>
                    {getScoreDescription(result.score)}
                  </h3>
                  <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
                    <Users className="w-4 h-4 mr-1" />
                    {user.nome.split(' ')[0]} & {formData.nome.split(' ')[0]}
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed mb-6">
                  {result.descricao}
                </p>

                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={() => setShowShareModal(true)}
                    variant="outline"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartilhar
                  </Button>
                  <Button
                    onClick={() => {
                      setResult(null);
                      setFormData({ nome: '', dataNascimento: '' });
                    }}
                  >
                    Nova Análise
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Areas Detail */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(result.areas).map(([area, score], index) => {
                const Icon = areaIcons[area as keyof typeof areaIcons];
                return (
                  <motion.div
                    key={area}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br ${getScoreGradient(score)} flex items-center justify-center mb-4`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {areaNames[area as keyof typeof areaNames]}
                        </h4>
                        <p className={`text-2xl font-bold ${getScoreColor(score)}`}>
                          {score}%
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Suggestions */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Sparkles className="w-5 h-5 text-purple-600 mr-2" />
                  <h3 className="text-xl font-semibold">Sugestões para o Relacionamento</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.sugestoes.map((sugestao, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="flex items-start"
                    >
                      <Star className="w-5 h-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700">{sugestao}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Invite Section */}
            {user.plano === 'gratuito' && (
              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                <CardContent className="p-6 text-center">
                  <Crown className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Análise Completa Premium
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Desbloqueie insights mais profundos sobre sua compatibilidade e envie um convite personalizado para {formData.nome.split(' ')[0]}.
                  </p>
                  <Button
                    onClick={() => setShowPremiumModal(true)}
                    variant="premium"
                  >
                    Upgrade Premium
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </div>

      {/* Share Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Compartilhar Resultado"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Share2 className="w-8 h-8 text-purple-600" />
          </div>
          
          <h3 className="text-xl font-semibold mb-4">
            Convide {formData.nome.split(' ')[0]} para ver o resultado completo
          </h3>
          
          <p className="text-gray-600 mb-6">
            Compartilhe este link para que {formData.nome.split(' ')[0]} possa acessar o mapa de compatibilidade completo.
          </p>
          
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 break-all">
              https://numbly.app/compatibility/share/{btoa(`${user.nome}-${formData.nome}`)}
            </p>
          </div>
          
          <div className="space-y-3">
            <Button className="w-full">
              <Send className="w-4 h-4 mr-2" />
              Copiar Link
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowShareModal(false)}
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Premium Modal */}
      <Modal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        title="Upgrade Premium"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-xl font-semibold mb-4">
            Desbloqueie Análises Completas
          </h3>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center">
              <Heart className="w-5 h-5 text-green-600 mr-3" />
              <span>Análises de compatibilidade ilimitadas</span>
            </div>
            <div className="flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-green-600 mr-3" />
              <span>Insights mais profundos sobre o relacionamento</span>
            </div>
            <div className="flex items-center justify-center">
              <Share2 className="w-5 h-5 text-green-600 mr-3" />
              <span>Convites personalizados para parceiros</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button variant="premium" className="w-full">
              Upgrade por R$ 19,90/mês
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowPremiumModal(false)}
              className="w-full"
            >
              Talvez depois
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
