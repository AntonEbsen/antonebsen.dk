import { test, expect } from '@playwright/test';

/**
 * Guards the Leaflet map pages.
 *
 * These maps were silently broken in production for a long time: Leaflet was loaded
 * from unpkg.com, which the site's own CSP allows in neither script-src nor
 * style-src, so the script never ran and the containers stayed empty. Nothing
 * failed loudly. These tests assert the maps actually initialise.
 */

const MAP_PAGES = [
    { path: '/map', container: '#map' },
    { path: '/camino', container: '#hub-mini-map' },
    { path: '/camino/route', container: '#camino-map' }
];

for (const { path, container } of MAP_PAGES) {
    test(`${path} initialises Leaflet`, async ({ page }) => {
        const cspErrors: string[] = [];
        page.on('console', (msg) => {
            const text = msg.text();
            if (msg.type() === 'error' && /Content Security Policy|Refused to/i.test(text)) {
                cspErrors.push(text);
            }
        });

        await page.goto(path);

        // Leaflet stamps this class on the container as soon as L.map() runs, so it
        // is a direct proof that the bundled script executed.
        await expect(page.locator(`${container}.leaflet-container`)).toBeAttached({ timeout: 15000 });

        // leaflet.css must be applied too, or tiles are positioned at 0,0 in a heap.
        const position = await page.locator(container).evaluate((el) => getComputedStyle(el).position);
        expect(position).toBe('relative');

        // Tiles are requested from the allow-listed hosts.
        await expect(page.locator(`${container} img.leaflet-tile`).first()).toBeAttached({ timeout: 15000 });
        const tileSrc = await page.locator(`${container} img.leaflet-tile`).first().getAttribute('src');
        expect(tileSrc).toMatch(/tile\.openstreetmap\.org|basemaps\.cartocdn\.com/);

        expect(cspErrors, `CSP violations on ${path}`).toEqual([]);
    });
}

test('/map renders marker icons with bundled asset URLs', async ({ page }) => {
    await page.goto('/map');
    await expect(page.locator('#map.leaflet-container')).toBeAttached({ timeout: 15000 });

    // Markers come from /api/travel, which needs Supabase; skip rather than fail
    // when the endpoint returns nothing locally.
    const marker = page.locator('img.leaflet-marker-icon').first();
    if ((await page.locator('img.leaflet-marker-icon').count()) === 0) {
        test.skip(true, 'No travel markers available (Supabase not configured locally)');
    }

    // Leaflet's default icon resolves image paths from the script URL, which breaks
    // under bundling and yields markers with a broken/relative src.
    const src = await marker.getAttribute('src');
    expect(src, 'marker icon src').toBeTruthy();
    expect(src).toContain('marker-icon');

    const loaded = await marker.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
    expect(loaded, 'marker icon image loaded').toBe(true);
});
