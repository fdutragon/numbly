'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/ui/app-layout';
import { Users, UserPlus, Heart, Star, MessageCircle, Share2 } from 'lucide-react';

export default function FriendsPage() {
  // Mock data para demonstração
  const friends = [
    {
      id: 1,
      nome: 'Ana Silva',
      numeroDestino: 3,
      compatibilidade: 85,
      avatar: '👩‍🦰'
    },
    {
      id: 2,
      nome: 'Carlos Oliveira',
      numeroDestino: 7,
      compatibilidade: 72,
      avatar: '👨‍🦱'
    },
    {
      id: 3,
      nome: 'Marina Santos',
      numeroDestino: 1,
      compatibilidade: 91,
      avatar: '👩‍🦳'
    }
  ];

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getCompatibilityText = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Boa';
    return 'Regular';
  };

  return (
    <AppLayout title="Amigos">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Seus Amigos Numerológicos
          </h1>
          <p className="text-gray-600 text-sm">
            Conecte-se e descubra a compatibilidade numerológica
          </p>
        </motion.div>

        {/* Add Friend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Adicionar Amigo</h3>
                    <p className="text-sm text-gray-600">Convide alguém para se conectar</p>
                  </div>
                </div>
                <Button size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Convidar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Friends List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center">
                <Heart className="w-5 h-5 mr-2 text-pink-500" />
                Seus Amigos ({friends.length})
              </h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {friends.map((friend, index) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{friend.avatar}</div>
                    <div>
                      <h3 className="font-medium text-gray-900">{friend.nome}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Star className="w-3 h-3" />
                        <span>Destino {friend.numeroDestino}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCompatibilityColor(friend.compatibilidade)}`}>
                      {friend.compatibilidade}% {getCompatibilityText(friend.compatibilidade)}
                    </div>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Coming Soon Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Em Breve</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Grupos Numerológicos</h3>
                  <p className="text-sm text-gray-600">Conecte-se com pessoas de números compatíveis</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Chat em Grupo</h3>
                  <p className="text-sm text-gray-600">Converse com seus amigos numerológicos</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Análise de Relacionamentos</h3>
                  <p className="text-sm text-gray-600">Insights profundos sobre suas conexões</p>
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
    </AppLayout>
  );
}
