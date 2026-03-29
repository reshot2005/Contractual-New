/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/gigs", destination: "/browse", permanent: true },
      { source: "/gigs/:id", destination: "/gig/:id", permanent: true },
      { source: "/freelancers/:id", destination: "/freelancer/:id", permanent: true },
      { source: "/dashboard/freelancer", destination: "/freelancer/dashboard", permanent: false },
      { source: "/dashboard/freelancer/gigs", destination: "/freelancer/browse-gigs", permanent: false },
      { source: "/dashboard/freelancer/applications", destination: "/freelancer/proposals", permanent: false },
      { source: "/dashboard/freelancer/orders", destination: "/freelancer/contracts", permanent: false },
      { source: "/freelancer/my-proposals", destination: "/freelancer/proposals", permanent: false },
      { source: "/freelancer/active-contracts", destination: "/freelancer/contracts", permanent: false },
      { source: "/dashboard/freelancer/earnings", destination: "/freelancer/earnings", permanent: false },
      { source: "/dashboard/freelancer/messages", destination: "/freelancer/messages", permanent: false },
      { source: "/dashboard/freelancer/notifications", destination: "/freelancer/notifications", permanent: false },
      { source: "/dashboard/business", destination: "/business/dashboard", permanent: false },
      { source: "/dashboard/business/post-gig", destination: "/business/post-gig", permanent: false },
      { source: "/dashboard/business/my-gigs", destination: "/business/my-gigs", permanent: false },
      { source: "/dashboard/business/applicants", destination: "/business/applications", permanent: false },
      { source: "/dashboard/business/orders", destination: "/business/contracts", permanent: false },
      { source: "/dashboard/business/messages", destination: "/business/messages", permanent: false },
      { source: "/dashboard/business/payments", destination: "/business/billing", permanent: false },
      { source: "/dashboard/business/reviews", destination: "/business/reviews", permanent: false },
      { source: "/dashboard/business/profile", destination: "/business/profile", permanent: false },
      { source: "/dashboard/business/notifications", destination: "/business/notifications", permanent: false },
      { source: "/dashboard/admin", destination: "/admin/dashboard", permanent: false },
      { source: "/dashboard/admin/messages", destination: "/admin/messages", permanent: false },
      { source: "/dashboard/admin/notifications", destination: "/admin/notifications", permanent: false },
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://hcaptcha.com https://*.hcaptcha.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://hcaptcha.com https://*.hcaptcha.com wss: ws:; frame-src https://hcaptcha.com https://*.hcaptcha.com;"
          }
        ],
      },
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "utfs.io", pathname: "/**" },
      { protocol: "https", hostname: "api.dicebear.com", pathname: "/**" },
    ],
  },
}

export default nextConfig
