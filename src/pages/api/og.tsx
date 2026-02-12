import { ImageResponse } from '@vercel/og';
import React from 'react';

export const prerender = false;

export async function GET({ request }: { request: Request }) {
    try {
        const { searchParams } = new URL(request.url);
        const title = searchParams.get('title')?.slice(0, 100) || 'Anton Ebsen';
        const desc = searchParams.get('desc')?.slice(0, 100) || 'Student of Economics (cand.polit)';

        // Font loading
        const fontData = await fetch(
            new URL('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff')
        ).then((res) => res.arrayBuffer());

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        backgroundColor: '#050505',
                        backgroundImage: 'radial-gradient(circle at 50% 0%, #1a1505 0%, #050505 60%)',
                        padding: '40px 80px',
                        fontFamily: '"Inter"',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '4px',
                            background: 'linear-gradient(90deg, #D4AF37 0%, transparent 100%)',
                        }}
                    />

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '20px',
                        }}
                    >
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #D4AF37 0%, #F4C430 100%)',
                                marginRight: '15px',
                            }}
                        />
                        <span
                            style={{
                                fontSize: 24,
                                color: '#D4AF37',
                                fontWeight: 600,
                                letterSpacing: '-0.02em',
                            }}
                        >
                            antonebsen.dk
                        </span>
                    </div>

                    <div
                        style={{
                            fontSize: 64,
                            fontWeight: 800,
                            color: '#f2f2f0',
                            lineHeight: 1.1,
                            marginBottom: '20px',
                            letterSpacing: '-0.03em',
                            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                        }}
                    >
                        {title}
                    </div>

                    <div
                        style={{
                            fontSize: 32,
                            color: '#a1a1aa',
                            lineHeight: 1.4,
                            maxWidth: '80%',
                        }}
                    >
                        {desc}
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
                        style: 'normal',
                        weight: 400,
                    },
                ],
            },
        );
    } catch (e: any) {
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
