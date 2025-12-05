import CTASection from "@/components/herosection/CTA";
import Featured from "@/components/herosection/Features";
import HeroSection from "@/components/herosection/Herosection";
import Testimonials from "@/components/reviews/Reviews";

export default function RootPage() {
  return (
    <div>
      <HeroSection />
      <Featured />
      <Testimonials/>
      <CTASection/>
    </div>
  )
}
