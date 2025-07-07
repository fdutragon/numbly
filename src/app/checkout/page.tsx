'use client';

import { CheckoutComponent } from '@/components/clara/checkout-component';

export function CheckoutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <CheckoutComponent isOpen={true} onClose={() => {}} plan="pro" />
    </div>
  );
}

export default CheckoutPage;
