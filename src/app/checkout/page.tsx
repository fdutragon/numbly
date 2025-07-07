'use client';

import { CheckoutComponent } from '@/components/clara/checkout-component';

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <CheckoutComponent isOpen={true} onClose={() => {}} plan="pro" />
    </div>
  );
}
