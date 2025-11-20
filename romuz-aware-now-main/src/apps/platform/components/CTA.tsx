import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Mail } from "lucide-react";

export const CTA = () => {
  return (
    <section className="py-24 px-4 bg-[var(--gradient-subtle)]">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center space-y-8 p-12 rounded-2xl border-2 border-accent/20 bg-card/50 backdrop-blur-sm shadow-[var(--shadow-soft)]">
          <h2 className="text-4xl md:text-5xl font-extrabold">
            Join the Movement
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stay informed about Romuz awareness initiatives and be part of the
            change. Subscribe to our newsletter for updates and ways to get
            involved.
          </p>

          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto pt-4">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Enter your email"
                className="pl-10 h-12"
              />
            </div>
            <Button variant="hero" size="lg" className="h-12 px-8">
              Subscribe
            </Button>
          </form>

          <p className="text-sm text-muted-foreground">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
};
