/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' https://www.youtube.com https://s.ytimg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; frame-src https://www.youtube.com; media-src https://www.youtube.com; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests; block-all-mixed-content"
          }
        ],
      },
    ]
  },
}

module.exports = nextConfig
