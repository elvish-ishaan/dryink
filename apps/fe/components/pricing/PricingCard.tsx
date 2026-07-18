'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

interface PricingCardProps {
  packageId: string;
  name: string;
  credits: number;
  priceUSD: number;
  features: readonly string[];
  badge?: string;
  highlighted?: boolean;
  onPurchaseSuccess?: () => void;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PricingCard({
  packageId,
  name,
  credits,
  priceUSD,
  features,
  badge,
  highlighted = false,
  onPurchaseSuccess,
}: PricingCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleBuyNow = async () => {
    if (!session?.user?.accessToken) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway. Please try again.');
        return;
      }

      const orderRes = await fetch(`${BACKEND_BASE_URL}/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.user.accessToken}`,
        },
        body: JSON.stringify({ packageId }),
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        toast.error(orderData.message || 'Failed to create order');
        return;
      }

      const options = {
        key:      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:   orderData.data.amount,
        currency: orderData.data.currency,
        name:     'Dryink',
        description: `${orderData.data.credits} Credits`,
        order_id: orderData.data.orderId,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch(`${BACKEND_BASE_URL}/payment/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.user!.accessToken}`,
              },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              toast.success(`${orderData.data.credits} credits added to your account!`);
              onPurchaseSuccess?.();
            } else {
              toast.error('Payment verification failed. Please contact support.');
            }
          } catch {
            toast.error('Verification failed. Please contact support.');
          }
        },
        prefill: { email: session.user?.email ?? '' },
        theme: { color: '#7c3aed' },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.info('Payment cancelled');
          },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.open();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-6 border transition-all ${
        highlighted
          ? 'bg-neutral-800 border-purple-600 shadow-lg shadow-purple-900/30'
          : 'bg-neutral-900 border-neutral-700'
      }`}
    >
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
          {badge}
        </span>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{name}</h3>
        <div className="mt-2 flex items-end gap-1">
          <span className="text-4xl font-bold text-white">${priceUSD}</span>
          <span className="text-neutral-400 mb-1">USD</span>
        </div>
        <p className="mt-1 text-purple-400 font-medium">{credits} credits</p>
      </div>

      <ul className="space-y-2 mb-6 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-neutral-300">
            <Check className="h-4 w-4 text-purple-400 shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      <Button
        onClick={handleBuyNow}
        disabled={loading}
        className={`w-full font-semibold ${
          highlighted
            ? 'bg-purple-600 hover:bg-purple-700 text-white'
            : 'bg-neutral-700 hover:bg-neutral-600 text-white'
        }`}
      >
        {loading ? 'Processing...' : 'Buy Now'}
      </Button>
    </div>
  );
}
