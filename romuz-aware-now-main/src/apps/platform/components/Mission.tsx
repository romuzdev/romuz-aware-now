import { Card } from "@/core/components/ui/card";
import { Heart, Users, Lightbulb } from "lucide-react";

export const Mission = () => {
  const values = [
    {
      icon: Heart,
      title: "Compassion",
      description: "Leading with empathy and understanding in all our initiatives",
    },
    {
      icon: Users,
      title: "Community",
      description: "Building strong connections and fostering inclusive spaces",
    },
    {
      icon: Lightbulb,
      title: "Education",
      description: "Spreading knowledge and awareness through meaningful engagement",
    },
  ];

  return (
    <section className="py-24 px-4 bg-[var(--gradient-subtle)]">
      <div className="container mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold">Our Mission</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We are dedicated to raising awareness, promoting understanding, and
            creating lasting positive impact in our communities.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <Card
                key={index}
                className="p-8 text-center space-y-4 border-2 hover:border-accent transition-all duration-300 hover:shadow-[var(--shadow-strong)] bg-card/50 backdrop-blur-sm"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                  <Icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
