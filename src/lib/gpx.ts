/**
 * Minimal GPX reader for turning a recorded hike into the numbers behind it.
 *
 * Runs at build time only (video detail pages are prerendered), so there is no
 * need for a full XML parser dependency — GPX track points have a fixed shape.
 *
 * Drop a .gpx export (GoPro, Strava, AllTrails, Garmin) into src/data/gpx/ and
 * reference it from the video's JSON via `gpxFile`.
 */

export interface TrackPoint {
    lat: number;
    lon: number;
    /** Metres above sea level. */
    ele: number;
    /** Milliseconds since epoch, when the GPX carries timestamps. */
    time?: number;
}

export interface ElevationSample {
    /** Cumulative distance from the start, in kilometres. */
    km: number;
    /** Altitude in metres. */
    ele: number;
}

/** [latitude, longitude] — the order Leaflet expects. */
export type LatLng = [number, number];

export interface TrailStats {
    distanceKm: number;
    elevationGainM: number;
    elevationLossM: number;
    minAltitudeM: number;
    maxAltitudeM: number;
    /** Moving+resting wall-clock duration in minutes; only when the GPX has timestamps. */
    durationMin?: number;
    /** Average speed in km/h over the wall-clock duration. */
    avgSpeedKmh?: number;
    /** Downsampled series for charting. */
    profile: ElevationSample[];
    /** Downsampled route for drawing on a map. */
    path: LatLng[];
}

const EARTH_RADIUS_M = 6371008.8;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance between two points, in metres. */
export function haversine(a: TrackPoint, b: TrackPoint): number {
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

    return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Pulls <trkpt lat="" lon=""> elements with their <ele> and <time> children. */
export function parseTrackPoints(xml: string): TrackPoint[] {
    const points: TrackPoint[] = [];
    const re = /<trkpt[^>]*\blat="([-\d.]+)"[^>]*\blon="([-\d.]+)"[^>]*>([\s\S]*?)<\/trkpt>|<trkpt[^>]*\blat="([-\d.]+)"[^>]*\blon="([-\d.]+)"[^>]*\/>/g;

    let match: RegExpExecArray | null;
    while ((match = re.exec(xml)) !== null) {
        const lat = Number(match[1] ?? match[4]);
        const lon = Number(match[2] ?? match[5]);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

        const inner = match[3] ?? '';
        const ele = Number(inner.match(/<ele>([-\d.eE+]+)<\/ele>/)?.[1]);
        const timeRaw = inner.match(/<time>([^<]+)<\/time>/)?.[1];
        const time = timeRaw ? Date.parse(timeRaw) : undefined;

        points.push({
            lat,
            lon,
            ele: Number.isFinite(ele) ? ele : 0,
            time: Number.isFinite(time as number) ? time : undefined
        });
    }

    return points;
}

/**
 * Elevation gain is noisy in raw GPS data — barometric jitter of a metre or two
 * per sample accumulates into hundreds of phantom metres over a long hike.
 * Only count a climb once it clears `threshold` metres.
 */
function accumulateElevation(points: TrackPoint[], threshold = 3) {
    let gain = 0;
    let loss = 0;
    let anchor = points[0]?.ele ?? 0;

    for (const point of points) {
        const delta = point.ele - anchor;
        if (delta >= threshold) {
            gain += delta;
            anchor = point.ele;
        } else if (delta <= -threshold) {
            loss += -delta;
            anchor = point.ele;
        }
    }

    return { gain: Math.round(gain), loss: Math.round(loss) };
}

/** Evenly downsamples a series so charts and map polylines stay light. */
function downsample<T>(samples: T[], target: number): T[] {
    if (samples.length <= target) return samples;

    const step = (samples.length - 1) / (target - 1);
    const out: T[] = [];
    for (let i = 0; i < target; i++) out.push(samples[Math.round(i * step)]);
    return out;
}

export function computeTrailStats(
    points: TrackPoint[],
    profilePoints = 120,
    // A polyline can carry more detail than a chart before it costs anything.
    pathPoints = 400
): TrailStats | null {
    if (points.length < 2) return null;

    const samples: ElevationSample[] = [];
    let metres = 0;

    samples.push({ km: 0, ele: Math.round(points[0].ele) });
    for (let i = 1; i < points.length; i++) {
        metres += haversine(points[i - 1], points[i]);
        samples.push({ km: +(metres / 1000).toFixed(3), ele: Math.round(points[i].ele) });
    }

    const { gain, loss } = accumulateElevation(points);
    const elevations = points.map((p) => p.ele);

    const first = points.find((p) => p.time !== undefined)?.time;
    const last = [...points].reverse().find((p) => p.time !== undefined)?.time;
    const durationMin =
        first !== undefined && last !== undefined && last > first
            ? Math.round((last - first) / 60000)
            : undefined;

    const distanceKm = +(metres / 1000).toFixed(2);

    return {
        distanceKm,
        elevationGainM: gain,
        elevationLossM: loss,
        minAltitudeM: Math.round(Math.min(...elevations)),
        maxAltitudeM: Math.round(Math.max(...elevations)),
        durationMin,
        avgSpeedKmh: durationMin ? +(distanceKm / (durationMin / 60)).toFixed(1) : undefined,
        profile: downsample(samples, profilePoints),
        path: downsample(
            points.map((p): LatLng => [+p.lat.toFixed(5), +p.lon.toFixed(5)]),
            pathPoints
        )
    };
}

/** Convenience: raw GPX text straight to stats. Returns null if unparseable. */
export function statsFromGpx(xml: string, profilePoints = 120, pathPoints = 400): TrailStats | null {
    return computeTrailStats(parseTrackPoints(xml), profilePoints, pathPoints);
}
