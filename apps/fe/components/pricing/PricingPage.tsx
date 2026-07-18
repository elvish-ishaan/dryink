'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';
import PricingCard from './PricingCard';
import EnterpriseModal from './EnterpriseModal';
import { useCredits } from '@/contexts/CreditsContext';
import { useSession } from 'next-auth/react';

const PLANS = [
  {
    packageId: 'starter',
    name: 'Starter',
    credits: 40,
    priceUSD: 20,
    features: [
      '40 video generations',
      'HD quality output',
      'Download videos',
      'All animation styles',
    ],
  },
  {
    packageId: 'pro',
    name: 'Pro',
    credits: 80,
    priceUSD: 40,
    badge: 'Most Popular',
    highlighted: true,
    features: [
      '80 video generations',
      'HD quality output',
      'Download videos',
      'All animation styles',
      'Priority generation',
    ],
  },
  {
    packageId: 'power',
    name: 'Power',
    credits: 170,
    priceUSD: 80,
    badge: 'Best Value',
    features: [
      '170 video generations',
      'HD quality output',
      'Download videos',
      'All animation styles',
      'Priority generation',
    ],
  },
] as const;

export default function PricingPage() {
  const [enterpriseOpen, setEnterpriseOpen] = useState(false);
  const { credits, refreshCredits } = useCredits();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Purple glow */}
      <div className="absolute inset-x-0 top-0 flex justify-center pointer-events-none overflow-hidden">
        <div className="w-[600px] h-[300px] bg-[#4a3294] rounded-full blur-[80px] opacity-40 -translate-y-1/2" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block bg-purple-900/50 border border-purple-700 text-purple-300 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6">
            Simple, Transparent Pricing
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Choose the plan that&apos;s right for you
          </h1>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto">
            Start with <span className="text-purple-400 font-semibold">5 free credits</span> on sign up. No credit card required.
            Credits never expire.
          </p>
          {session?.user && (
            <p className="mt-3 text-sm text-neutral-500">
              Your current balance: <span className="text-purple-400 font-medium">{credits} credits</span>
            </p>
          )}
        </div>

        {/* Pricing grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.packageId}
              {...plan}
              onPurchaseSuccess={refreshCredits}
            />
          ))}
        </div>

        {/* Enterprise card */}
        <div className="rounded-2xl border border-neutral-700 bg-neutral-900 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-purple-900/40 border border-purple-700 flex items-center justify-center shrink-0">
              <Building2 className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Enterprise / Custom</h3>
              <p className="text-neutral-400 mt-0.5">
                Need more than 170 credits or custom integrations? We&apos;ve got you covered.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setEnterpriseOpen(true)}
            className="shrink-0 bg-neutral-700 hover:bg-neutral-600 text-white border border-neutral-600 px-6"
          >
            Contact Us
          </Button>
        </div>

        {/* FAQ note */}
        <p className="text-center text-sm text-neutral-500 mt-10">
          Credits are one-time purchases and never expire. 1 credit = 1 video generation (including follow-ups).
        </p>
      </div>

      <EnterpriseModal open={enterpriseOpen} onOpenChange={setEnterpriseOpen} />
    </div>
  );
}
