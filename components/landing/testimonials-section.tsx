interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string | null;
  location: string | null;
  rating: number | null;
}

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  if (testimonials.length === 0) return null;

  return (
    <section className="border-t bg-muted/20 px-4 py-20 md:py-28">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Client experiences
          </p>
          <h2 className="mt-3 text-3xl font-light tracking-tight md:text-4xl">
            What clients say
          </h2>
          <p className="mt-4 text-muted-foreground">
            Real feedback from buyers, sellers, and investors who have worked with
            the team.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <figure key={testimonial.id} className="rounded-3xl border bg-background p-6 shadow-sm">
              {testimonial.rating && (
                <div className="mb-4 text-sm tracking-[0.2em] text-primary" aria-label={`${testimonial.rating} out of 5 stars`}>
                  {"★".repeat(Math.min(testimonial.rating, 5))}
                </div>
              )}
              <blockquote className="leading-7 text-muted-foreground">
                “{testimonial.quote}”
              </blockquote>
              <figcaption className="mt-5">
                <p className="font-medium">{testimonial.name}</p>
                {(testimonial.role || testimonial.location) && (
                  <p className="text-sm text-muted-foreground">
                    {[testimonial.role, testimonial.location].filter(Boolean).join(" · ")}
                  </p>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
