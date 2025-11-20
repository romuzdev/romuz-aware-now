export const Impact = () => {
  const stats = [
    { number: "10K+", label: "Community Members" },
    { number: "500+", label: "Events Hosted" },
    { number: "50+", label: "Partner Organizations" },
    { number: "100%", label: "Commitment to Change" },
  ];

  return (
    <section className="py-24 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold">Our Impact</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Together, we've made significant strides in creating awareness and
            fostering positive change.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center space-y-2 p-6 rounded-lg hover:bg-accent/5 transition-colors duration-300"
            >
              <div className="text-5xl md:text-6xl font-extrabold text-accent">
                {stat.number}
              </div>
              <div className="text-sm md:text-base text-muted-foreground font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
