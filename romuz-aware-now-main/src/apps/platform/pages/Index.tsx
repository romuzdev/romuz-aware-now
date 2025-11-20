import { Link } from "react-router-dom";
import { Hero } from "../components/Hero";
import { Mission } from "../components/Mission";
import { Impact } from "../components/Impact";
import { CTA } from "../components/CTA";
import { Button } from "@/core/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Auth buttons */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <Button asChild variant="outline">
          <Link to="/auth/login">Sign in</Link>
        </Button>
        <Button asChild>
          <Link to="/auth/signup">Sign up</Link>
        </Button>
      </div>

      <Hero />
      <Mission />
      <Impact />
      <CTA />
      
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2024 Romuz Awareness. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
