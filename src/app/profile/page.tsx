'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/ui/app-layout';
import { useUserStore } from '@/lib/stores/user-store';
import { User, Calendar, Star, Heart, Sparkles, Crown, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const router = useRouter();
  const { user, mapa, logout } = useAuth();
  
  // Proteger rota
  useAuth().requireAuth();
  
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
      <AppLayout title="Perfil">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <p className="text-gray-600">Carregando perfil...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const profileStats = [
    {
      label: 'Número do Destino',
      value: user.numeroDestino,
      icon: Star,
      color: 'text-purple-600 bg-purple-50'
    },
    {
      label: 'Número da Sorte',
      value: mapa.numeroSorte,
      icon: Sparkles,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      label: 'Plano Atual',
      value: user.plano === 'gratuito' ? 'Gratuito' : 'Premium',
      icon: user.plano === 'gratuito' ? User : Crown,
      color: user.plano === 'gratuito' ? 'text-gray-600 bg-gray-50' : 'text-yellow-600 bg-yellow-50'
    },
    {
      label: 'Ciclo de Vida',
      value: mapa.cicloVida.fase,
      icon: Calendar,
      color: 'text-green-600 bg-green-50'
    }
  ];

  return (
    <AppLayout title="Perfil">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-gray-900">{user.nome}</h1>
                  <p className="text-gray-600">
                    Nascido em {new Date(user.dataNascimento).toLocaleDateString('pt-BR')}
                  </p>
                  <div className="flex items-center mt-2">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-sm text-gray-600">
                      Número do Destino: {user.numeroDestino}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <Settings className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid grid-cols-2 gap-4">
            {profileStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center mx-auto mb-2`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-600">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Numerological Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
                Seus Insights Numerológicos
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Potencial</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {mapa.potencial}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Fortalezas</h3>
                <div className="flex flex-wrap gap-2">
                  {mapa.fortalezas.map((fortaleza, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full"
                    >
                      {fortaleza}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Desafios a Superar</h3>
                <div className="space-y-1">
                  {mapa.desafios.map((desafio, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-2" />
                      {desafio}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Love & Relationships */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center">
                <Heart className="w-5 h-5 mr-2 text-pink-500" />
                Amor e Relacionamentos
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">
                {mapa.amor}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Life Cycle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                Ciclo de Vida Atual
              </h2>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{mapa.cicloVida.fase}</span>
                  <span className="text-sm text-gray-600">{mapa.cicloVida.periodo}</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {mapa.cicloVida.descricao}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {user.plano === 'gratuito' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Desbloqueie Seu Potencial Completo
                    </h3>
                    <p className="text-sm text-gray-700 mb-3">
                      Com o Premium, acesse análises mais profundas, previsões personalizadas e muito mais.
                    </p>
                    <Button size="sm" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                      <Crown className="w-4 h-4 mr-2" />
                      Assinar Premium
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
