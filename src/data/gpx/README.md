# GPX tracks

Drop a `.gpx` export here (GoPro Quik, Strava, AllTrails, Garmin Connect all
export this format), then reference the filename from the video's JSON:

```json
{
  "youtubeId": "Y4hDMjNbL5U",
  "track": "hiking",
  "gpxFile": "dolomites-day-1.gpx"
}
```

At build time [`src/lib/trail.ts`](../../lib/trail.ts) derives distance, elevation
gain and loss, max altitude, duration and the elevation profile from the track
points, and the video's detail page renders them as stat tiles plus a chart.

Nothing here is required. If you don't have a GPX, fill in `trail` by hand
instead — the same tiles render, minus the profile chart:

```json
{
  "trail": {
    "distanceKm": 12.4,
    "elevationGainM": 940,
    "durationMin": 285,
    "steps": 18200,
    "startPlace": "Cortina d'Ampezzo",
    "endPlace": "Rifugio Nuvolau"
  }
}
```

Values written in `trail` always win over values derived from the GPX, so you can
correct a single figure without discarding the track. Elevation gain ignores
climbs under 3 m to avoid accumulating GPS barometric jitter into phantom metres.
