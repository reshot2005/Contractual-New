const companies = [
  "Ettiquete",
  "Jaya Janardhana",
  "Atlasia",
  "SRR",
  "OFF-CampusClub",

]

export function TrustedBySection() {
  return (
    <section className="py-12 bg-white overflow-hidden">
      <div className="container-page">
        <p className="text-center text-sm text-[var(--text-secondary)] mb-8">
          Trusted by leading businesses
        </p>

        {/* Marquee container */}
        <div className="relative">
          {/* Gradient fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />

          {/* Scrolling logos */}
          <div className="flex overflow-hidden">
            <div className="flex animate-marquee">
              {[...companies, ...companies].map((company, index) => (
                <div
                  key={`${company}-${index}`}
                  className="flex-shrink-0 mx-8 flex items-center justify-center"
                >
                  <div className="px-8 py-4 rounded-lg bg-[var(--bg-alt)] border border-[var(--border)]">
                    <span className="text-lg font-semibold text-[var(--text-secondary)]">
                      {company}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex animate-marquee" aria-hidden="true">
              {[...companies, ...companies].map((company, index) => (
                <div
                  key={`${company}-duplicate-${index}`}
                  className="flex-shrink-0 mx-8 flex items-center justify-center"
                >
                  <div className="px-8 py-4 rounded-lg bg-[var(--bg-alt)] border border-[var(--border)]">
                    <span className="text-lg font-semibold text-[var(--text-secondary)]">
                      {company}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
