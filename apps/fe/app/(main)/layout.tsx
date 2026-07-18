import { CreditsProvider } from '@/contexts/CreditsContext';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <CreditsProvider>
      <main>{children}</main>
    </CreditsProvider>
  );
}
