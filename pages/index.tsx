import { Layout } from '../components/Layout/Layout';
import { HeroSection } from '../components/marketing/HeroSection';
import { ReassuranceRow } from '../components/marketing/ReassuranceRow';
import { HowItWorksStrip } from '../components/marketing/HowItWorksStrip';

export default function LandingPage() {
  return (
    <Layout title="StorySmith – Create Stories Together">
      {/* 1. The Welcome Gate */}
      <HeroSection />

      {/* 2. The Trust Builder */}
      <ReassuranceRow />

      {/* 3. The Map of the Ride */}
      <HowItWorksStrip />
    </Layout>
  );
}
