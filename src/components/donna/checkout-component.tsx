'use client';

export interface CheckoutComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CheckoutComponent({ isOpen, onClose, onSuccess }: CheckoutComponentProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Checkout</h2>
        
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Plano Básico</h3>
            <p className="text-2xl font-bold mb-2">R$ 47/mês</p>
            <ul className="space-y-2 text-sm">
              <li>✅ Atendimento 24/7</li>
              <li>✅ Respostas em 3 segundos</li>
              <li>✅ Qualificação automática</li>
              <li>✅ Setup grátis hoje</li>
              <li>✅ 7 dias grátis</li>
            </ul>
          </div>

          <button
            onClick={onSuccess}
            className="w-full py-2 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
          >
            Começar Agora
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
} 