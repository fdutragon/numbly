'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle, 
  XCircle, 
  Loader2,
  KeyRound,
  Sparkles
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function RecoverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de recuperação não encontrado');
      return;
    }

    confirmRecovery();
  }, [token]);

  const confirmRecovery = async () => {
    try {
      const deviceId = generateDeviceId();
      
      const response = await fetch('/api/auth/confirm-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, deviceId })
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setMessage('Acesso recuperado com sucesso!');
        
        // Aguardar um momento e redirecionar
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(result.error || 'Erro na recuperação');
      }

    } catch (error) {
      console.error('Erro na recuperação:', error);
      setStatus('error');
      setMessage('Erro de conexão. Tente novamente.');
    }
  };

  const generateDeviceId = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    const userAgent = navigator.userAgent.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    return `recover-${timestamp}-${random}-${userAgent}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-6">
            {/* Header */}
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Recuperação de Acesso
              </h3>
            </div>

            {/* Status */}
            <div className="space-y-4">
              {status === 'loading' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      Recuperando Acesso...
                    </h2>
                    <p className="text-gray-600">
                      Aguarde enquanto validamos sua identidade
                    </p>
                  </div>
                </motion.div>
              )}

              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto"
                  >
                    <CheckCircle className="w-10 h-10 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      🔓 Acesso Recuperado!
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {message}
                    </p>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <p className="text-sm text-gray-700">
                        ✨ Bem-vindo de volta! Redirecionando...
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto">
                    <XCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      Erro na Recuperação
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {message}
                    </p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-700">
                        ⚠️ Tente iniciar a recuperação novamente
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
