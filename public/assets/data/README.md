# Replication data

Files dropped here are served at `/assets/data/<name>` and are what the in-browser
DuckDB playground (`src/components/project/DataPlayground.tsx`) queries.

A project page opts into the playground by adding a `dataLinks` entry whose **label
contains the lowercase string `csv`** — that substring is the trigger in
`ProjectDetailPage.astro`. The playground loads the file into a table called
`main_data` with schema auto-detection, so column names come straight from the CSV
header.

If a file listed below is missing, the playground detects it up front and shows a
"not published yet" state instead of failing on the first query. Nothing breaks; the
section simply stays inert until the file lands.

## Expected files

| File | Project | Status |
|---|---|---|
| `welfare-state-panel.csv` | [Globalization and the Welfare State](/projects/welfare-state-seminar) | **Published.** 32 OECD countries × 1980–2023 (1,408 rows). Columns: `iso3`, `year`, `sstran`, the four KOF headline indices plus their sub-components, and the six controls (`ln_gdppc`, `inflation_cpi`, `deficit`, `debt`, `ln_population`, `dependency_ratio`). Identical to `data/final/master_dataset.csv` in the [replication repo](https://github.com/AntonEbsen/economics-of-the-welfare-state); every summary statistic matches Table A.1 of the paper. |
| `gfc_cleaned.csv` | [Global Financial Cycle](/projects/global-financial-cycle) | Not published. The page links to it today; the playground degrades gracefully. |
| `ecb_replication.zip` | [ECB Taylor Rules](/projects/ecb-taylor-rules) | Not published. |

Keep files small enough to serve statically — the browser downloads the whole thing
before the first query.
