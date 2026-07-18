import type { Metadata } from 'next';
import PricingPage from '@/components/pricing/PricingPage';

export const metadata: Metadata = {
  title: 'Pricing – Dryink',
  description: 'Simple, transparent credit-based pricing for Dryink. Start with 5 free credits.',
};

export default function Page() {
  return <PricingPage />;
}
