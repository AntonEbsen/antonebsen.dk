import { statsFromGpx, type ElevationSample, type LatLng } from './gpx';

/**
 * Resolves the "trail in numbers" for a video.
 *
 * GPX files are pulled in eagerly at build time via import.meta.glob, so no
 * filesystem access is needed and a missing folder is simply an empty set.
 */
const gpxFiles = import.meta.glob('/src/data/gpx/*.gpx', {
    query: '?raw',
    import: 'default',
    eager: true
}) as Record<string, string>;

export interface ResolvedTrail {
    distanceKm?: number;
    elevationGainM?: number;
    elevationLossM?: number;
    maxAltitudeM?: number;
    durationMin?: number;
    steps?: number;
    avgSpeedKmh?: number;
    startPlace?: string;
    endPlace?: string;
    profile: ElevationSample[];
    /** Route coordinates for the map; empty when there is no GPX. */
    path: LatLng[];
    /** True when any figure is present — templates use this to decide whether to render. */
    hasData: boolean;
    /** True when a profile chart is worth drawing. */
    hasProfile: boolean;
    /** True when there is a route worth mapping. */
    hasPath: boolean;
}

interface VideoTrailInput {
    gpxFile?: string;
    trail?: {
        distanceKm?: number;
        elevationGainM?: number;
        elevationLossM?: number;
        maxAltitudeM?: number;
        durationMin?: number;
        steps?: number;
        startPlace?: string;
        endPlace?: string;
    };
}

/** Hand-entered values in `trail` take precedence over anything derived from the GPX. */
export function resolveTrail(video: VideoTrailInput): ResolvedTrail {
    const manual = video.trail ?? {};

    let derived: ReturnType<typeof statsFromGpx> = null;
    if (video.gpxFile) {
        const key = Object.keys(gpxFiles).find((path) => path.endsWith(`/${video.gpxFile}`));
        if (key) {
            derived = statsFromGpx(gpxFiles[key]);
        } else {
            console.warn(`GPX file "${video.gpxFile}" not found in src/data/gpx/ — falling back to manual trail values.`);
        }
    }

    const merged: ResolvedTrail = {
        distanceKm: manual.distanceKm ?? derived?.distanceKm,
        elevationGainM: manual.elevationGainM ?? derived?.elevationGainM,
        elevationLossM: manual.elevationLossM ?? derived?.elevationLossM,
        maxAltitudeM: manual.maxAltitudeM ?? derived?.maxAltitudeM,
        durationMin: manual.durationMin ?? derived?.durationMin,
        steps: manual.steps,
        avgSpeedKmh: derived?.avgSpeedKmh,
        startPlace: manual.startPlace,
        endPlace: manual.endPlace,
        profile: derived?.profile ?? [],
        path: derived?.path ?? [],
        hasData: false,
        hasProfile: false,
        hasPath: false
    };

    // Recompute average speed if the duration or distance was overridden by hand.
    if (merged.distanceKm && merged.durationMin) {
        merged.avgSpeedKmh = +(merged.distanceKm / (merged.durationMin / 60)).toFixed(1);
    }

    merged.hasProfile = merged.profile.length > 1;
    merged.hasPath = merged.path.length > 1;
    merged.hasData =
        merged.hasProfile ||
        merged.hasPath ||
        [merged.distanceKm, merged.elevationGainM, merged.durationMin, merged.steps, merged.maxAltitudeM]
            .some((v) => typeof v === 'number');

    return merged;
}
