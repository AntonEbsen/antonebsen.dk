import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ request }) => {
  const url = new URL(request.url);
  const isCom = url.hostname.includes('antonebsen.com');
  const domain = isCom ? 'https://antonebsen.com' : 'https://antonebsen.dk';

  const robots = `
User-agent: *
Allow: /

# Keep admin, internal and API routes out of search results
Disallow: /admin
Disallow: /dashboard
Disallow: /debug
Disallow: /api/

Sitemap: ${domain}/sitemap-index.xml
Sitemap: ${domain}/video-sitemap.xml
`.trim();

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
