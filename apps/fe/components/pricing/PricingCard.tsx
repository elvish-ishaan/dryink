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
          ? 'bg-white dark:bg-neutral-800 border-[#4a3294] shadow-lg shadow-[#4a3294]/10'
          : 'bg-[#f8f8f8] dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700'
      }`}
    >
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#4a3294] text-white text-xs font-badge px-3 py-1 rounded-full shadow-sm">
          {badge}
        </span>
      )}

      <div className="mb-4">
        <h3 className="font-nav text-lg font-semibold text-black dark:text-white">{name}</h3>
        <div className="mt-2 flex items-end gap-1">
          <span className="font-heading text-4xl font-bold tracking-[-1px] text-black dark:text-white">${priceUSD}</span>
          <span className="font-body text-neutral-500 mb-1">USD</span>
        </div>
        <p className="mt-1 font-body text-[#4a3294] font-medium">{credits} credits</p>
      </div>

      <ul className="space-y-2 mb-6 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 font-body text-sm text-neutral-700 dark:text-neutral-300">
            <Check className={`h-4 w-4 shrink-0 ${highlighted ? 'text-[#4a3294]' : 'text-neutral-500'}`} />
            {f}
          </li>
        ))}
      </ul>

      <Button
        onClick={handleBuyNow}
        disabled={loading}
        className={`w-full rounded-full font-nav font-medium ${
          highlighted
            ? 'bg-[#4a3294] hover:bg-[#3b2875] text-white'
            : 'bg-black hover:bg-black/80 text-white'
        }`}
      >
        {loading ? 'Processing...' : 'Buy Now'}
      </Button>
    </div>
  );
}
