import { describe, it, expect } from 'vitest';
import { parseTrackPoints, haversine, computeTrailStats, statsFromGpx } from './gpx';

// Four points climbing a ridge, one degree of longitude apart at the equator
// so the distances are easy to reason about.
const GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GoPro">
  <trk><name>Dolomites day 1</name><trkseg>
    <trkpt lat="46.5400" lon="11.9800"><ele>1200.0</ele><time>2026-07-27T07:00:00Z</time></trkpt>
    <trkpt lat="46.5450" lon="11.9850"><ele>1260.0</ele><time>2026-07-27T07:30:00Z</time></trkpt>
    <trkpt lat="46.5500" lon="11.9900"><ele>1400.0</ele><time>2026-07-27T08:00:00Z</time></trkpt>
    <trkpt lat="46.5550" lon="11.9950"><ele>1310.0</ele><time>2026-07-27T08:30:00Z</time></trkpt>
  </trkseg></trk>
</gpx>`;

describe('parseTrackPoints', () => {
    it('reads lat/lon/ele/time from each trkpt', () => {
        const pts = parseTrackPoints(GPX);

        expect(pts).toHaveLength(4);
        expect(pts[0].lat).toBeCloseTo(46.54, 5);
        expect(pts[0].lon).toBeCloseTo(11.98, 5);
        expect(pts[0].ele).toBe(1200);
        expect(pts[0].time).toBe(Date.parse('2026-07-27T07:00:00Z'));
    });

    it('handles self-closing trkpt elements without elevation', () => {
        const pts = parseTrackPoints('<gpx><trkpt lat="1.0" lon="2.0"/></gpx>');

        expect(pts).toHaveLength(1);
        expect(pts[0].ele).toBe(0);
        expect(pts[0].time).toBeUndefined();
    });

    it('returns [] for non-GPX input rather than throwing', () => {
        expect(parseTrackPoints('')).toEqual([]);
        expect(parseTrackPoints('<html>not a gpx</html>')).toEqual([]);
    });
});

describe('haversine', () => {
    it('measures one degree of latitude as ~111 km', () => {
        const d = haversine({ lat: 0, lon: 0, ele: 0 }, { lat: 1, lon: 0, ele: 0 });

        expect(d / 1000).toBeGreaterThan(110);
        expect(d / 1000).toBeLessThan(112);
    });

    it('is zero for identical points', () => {
        expect(haversine({ lat: 46.5, lon: 11.9, ele: 0 }, { lat: 46.5, lon: 11.9, ele: 0 })).toBe(0);
    });
});

describe('computeTrailStats', () => {
    it('separates climb from descent', () => {
        const stats = statsFromGpx(GPX)!;

        // +60, +140 climbing, then -90 down.
        expect(stats.elevationGainM).toBe(200);
        expect(stats.elevationLossM).toBe(90);
        expect(stats.minAltitudeM).toBe(1200);
        expect(stats.maxAltitudeM).toBe(1400);
    });

    it('derives duration and average speed from timestamps', () => {
        const stats = statsFromGpx(GPX)!;

        expect(stats.durationMin).toBe(90);
        expect(stats.avgSpeedKmh).toBeCloseTo(+(stats.distanceKm / 1.5).toFixed(1), 1);
    });

    it('builds a profile whose distance is monotonic and ends at the total', () => {
        const stats = statsFromGpx(GPX)!;

        expect(stats.profile[0].km).toBe(0);
        expect(stats.profile.at(-1)!.km).toBeCloseTo(stats.distanceKm, 1);
        for (let i = 1; i < stats.profile.length; i++) {
            expect(stats.profile[i].km).toBeGreaterThanOrEqual(stats.profile[i - 1].km);
        }
    });

    it('ignores sub-threshold barometric jitter instead of inflating the climb', () => {
        // 200 samples oscillating +/-1 m at a standstill: a naive sum would report
        // hundreds of metres of gain.
        const noisy = Array.from({ length: 200 }, (_, i) => ({
            lat: 46.54, lon: 11.98, ele: 1200 + (i % 2)
        }));

        expect(computeTrailStats(noisy)!.elevationGainM).toBe(0);
    });

    it('downsamples long tracks for charting', () => {
        const long = Array.from({ length: 5000 }, (_, i) => ({
            lat: 46.54 + i * 0.0001, lon: 11.98, ele: 1200 + i * 0.1
        }));

        expect(computeTrailStats(long, 120)!.profile).toHaveLength(120);
    });

    it('returns null when there is nothing to measure', () => {
        expect(computeTrailStats([])).toBeNull();
        expect(computeTrailStats([{ lat: 1, lon: 2, ele: 3 }])).toBeNull();
    });

    it('omits duration when the GPX carries no timestamps', () => {
        const stats = statsFromGpx('<gpx><trkpt lat="46.54" lon="11.98"><ele>1200</ele></trkpt><trkpt lat="46.55" lon="11.99"><ele>1300</ele></trkpt></gpx>')!;

        expect(stats.durationMin).toBeUndefined();
        expect(stats.avgSpeedKmh).toBeUndefined();
        expect(stats.elevationGainM).toBe(100);
    });
});
