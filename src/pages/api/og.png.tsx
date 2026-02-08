import { ImageResponse } from '@vercel/og';

export const prerender = false;

export async function GET({ request }: { request: Request }) {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'Anton Meier Ebsen Jørgensen';
    const subtitle = searchParams.get('subtitle') || 'Student of Economics (cand.polit)';
    const tech = searchParams.get('tech')?.split(',') || [];

    // Load a font (Inter)
    // We can fetch it from CDN or use a local file if configured, but fetch is easier for Vercel/Edge
    const fontData = await fetch(new URL('https://github.com/google/fonts/raw/main/ofl/inter/Inter-Bold.ttf', import.meta.url)).then(
        (res) => res.arrayBuffer()
    );

    const regularFontData = await fetch(new URL('https://github.com/google/fonts/raw/main/ofl/inter/Inter-Regular.ttf', import.meta.url)).then(
        (res) => res.arrayBuffer()
    );

    return new ImageResponse(
        (
            <div
        style= {{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#020617', // slate-950
        backgroundImage: 'radial-gradient(circle at 50% 0%, #1e293b 0%, #020617 70%)',
        fontFamily: '"Inter"',
        padding: '40px 80px',
        color: 'white',
    }}
      >
    {/* Accent Glow */ }
    < div
style = {{
    position: 'absolute',
        top: '-200px',
            right: '-100px',
                width: '600px',
                    height: '600px',
                        background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, rgba(0,0,0,0) 70%)',
                            filter: 'blur(80px)',
          }}
        />

{/* Small header */ }
<div style={ { display: 'flex', alignItems: 'center', marginBottom: '40px', gap: '16px' } }>
    <div style={ { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: '#000' } }> A </div>
        < div style = {{ fontSize: '24px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}> antonebsen.dk </div>
            </div>

{/* Title */ }
<div
          style={
    {
        fontSize: '72px',
            fontWeight: 800,
                textAlign: 'center',
                    marginBottom: '20px',
                        lineHeight: 1.1,
                            background: 'linear-gradient(to bottom right, #ffffff, #cbd5e1)',
                                backgroundClip: 'text',
                                    color: 'transparent',
                                        textShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }
}
        >
    { title }
    </div>

{/* Subtitle */ }
<div
          style={
    {
        fontSize: '32px',
            color: '#94a3b8',
                textAlign: 'center',
                    marginBottom: '60px',
                        maxWidth: '900px',
                            lineHeight: 1.4,
                                fontWeight: 400
    }
}
        >
    { subtitle.length > 120 ? subtitle.substring(0, 120) + '...' : subtitle }
    </div>

{/* Tech Stack Pills */ }
<div style={ { display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' } }>
{
    tech.slice(0, 6).map((t) => (
        <div
              key= { t }
              style = {{
        backgroundColor: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '999px',
        padding: '10px 24px',
        fontSize: '20px',
        color: '#e2e8f0',
        display: 'flex',
        alignItems: 'center',
    }}
    >
    { t }
    </div>
          ))}
</div>

{/* Footer decoration */ }
<div style={ { position: 'absolute', bottom: '40px', fontSize: '18px', color: '#475569' } }>
    Research • Data Science • Economics
        </div>

        </div>
    ),
{
    width: 1200,
        height: 630,
            fonts: [
                {
                    name: 'Inter',
                    data: fontData,
                    weight: 700,
                    style: 'normal',
                },
                {
                    name: 'Inter',
                    data: regularFontData,
                    weight: 400,
                    style: 'normal',
                },
            ],
    },
  );
}
