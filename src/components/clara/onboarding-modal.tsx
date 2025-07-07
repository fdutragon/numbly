'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  X, 
  User, 
  Briefcase, 
  MessageCircle, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const onboardingSchema = z.object({
  firstName: z.string().min(2, 'Nome muito curto'),
  profession: z.string().min(2, 'Profissão deve ter pelo menos 2 caracteres'),
  whatsapp: z.string().min(10, 'WhatsApp inválido'),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const professionOptions = [
  'Agência de Marketing',
  'E-commerce',
  'Consultor',
  'Afiliado',
  'Infoprodutor',
  'Loja Física',
  'Prestador de Serviços',
  'Outro'
];

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ElementType;
}

const steps: OnboardingStep[] = [
  {
    title: 'Qual seu primeiro nome?',
    description: 'Vamos personalizar a Clara para você',
    icon: User
  },
  {
    title: 'Qual sua profissão?',
    description: 'Isso nos ajuda a personalizar as análises',
    icon: Briefcase
  },
  {
    title: 'Seu WhatsApp',
    description: 'Para onde a Clara vai enviar os relatórios',
    icon: MessageCircle
  }
];

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onChange'
  });

  const watchedValues = watch();

  useEffect(() => {
    const handleOpenOnboarding = () => {
      setIsOpen(true);
    };

    window.addEventListener('open-onboarding', handleOpenOnboarding);
    return () => window.removeEventListener('open-onboarding', handleOpenOnboarding);
  }, []);

  const onSubmit = async (data: OnboardingFormData) => {
    console.log('Onboarding data:', data);
    
    // Here you would typically save the data to your backend
    // For now, we'll just simulate a success
    setIsCompleted(true);
    
    setTimeout(() => {
      setIsOpen(false);
      setIsCompleted(false);
      setCurrentStep(0);
      // Redirect to WhatsApp or show success message
      showWhatsAppRedirect(data.firstName);
    }, 2000);
  };

  const showWhatsAppRedirect = (firstName: string) => {
    const message = encodeURIComponent(
      `Olá! Sou ${firstName} e acabei de ativar minha Clara. Gostaria de configurar o monitoramento das minhas campanhas.`
    );
    const whatsappUrl = `https://wa.me/5511999999999?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return watchedValues.firstName && watchedValues.firstName.length >= 2;
      case 1:
        return watchedValues.profession && watchedValues.profession.length >= 2;
      case 2:
        return watchedValues.whatsapp && watchedValues.whatsapp.length >= 10;
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  if (isCompleted) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Clara configurada!
          </h3>
          
          <p className="text-muted-foreground mb-6">
            Perfeito! Agora vamos conectar sua conta do Google Ads. 
            Você será redirecionado para o WhatsApp da Clara.
          </p>
          
          <div className="flex items-center justify-center gap-2 text-green-600">
            <Sparkles className="w-5 h-5" />
            <span>Redirecionando...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Configurar Clara</h2>
              <p className="text-blue-100">Etapa {currentStep + 1} de {steps.length}</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6 bg-white/20 rounded-full h-2">
            <motion.div
              className="bg-white rounded-full h-2"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center mb-8"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                {(() => {
                  const IconComponent = steps[currentStep].icon;
                  return <IconComponent className="w-8 h-8 text-white" />;
                })()}
              </div>
              
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {steps[currentStep].title}
              </h3>
              
              <p className="text-muted-foreground">
                {steps[currentStep].description}
              </p>
            </motion.div>
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
              >
                {currentStep === 0 && (
                  <div>
                    <Input
                      {...register('firstName')}
                      placeholder="Ex: João"
                      className="text-center text-lg py-4"
                      autoFocus
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-2 text-center">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {professionOptions.map((profession) => (
                        <button
                          key={profession}
                          type="button"
                          onClick={() => setValue('profession', profession)}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                            watchedValues.profession === profession
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          {profession}
                        </button>
                      ))}
                    </div>
                    
                    <Input
                      {...register('profession')}
                      placeholder="Ou digite sua profissão"
                      className="text-center"
                    />
                    
                    {errors.profession && (
                      <p className="text-red-500 text-sm text-center">
                        {errors.profession.message}
                      </p>
                    )}
                  </div>
                )}

                {currentStep === 2 && (
                  <div>
                    <Input
                      {...register('whatsapp')}
                      placeholder="(11) 99999-9999"
                      className="text-center text-lg py-4"
                      autoFocus
                    />
                    {errors.whatsapp && (
                      <p className="text-red-500 text-sm mt-2 text-center">
                        {errors.whatsapp.message}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      É neste número que a Clara vai te enviar os relatórios
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center gap-2"
                >
                  Próximo
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!isValid}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Finalizar
                </Button>
              )}
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
