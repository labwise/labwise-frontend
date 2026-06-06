import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import JackpotFlask from '@/components/JackpotFlask';
import WinnerTicker from '@/components/WinnerTicker';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <WinnerTicker />
      <main className="flex-1">{children}</main>
      <Footer />
      <JackpotFlask />
    </div>
  );
}
