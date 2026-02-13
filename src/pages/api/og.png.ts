import { ImageResponse } from '@vercel/og';
import { OGImageResponse } from '@components/templates/OGImageResponse';
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
            React.createElement(OGImageResponse, { title, desc }),
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
