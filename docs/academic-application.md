# Application-facing pages

The compact English and Danish CVs live at `/en/cv` and `/cv`. The older,
broader profiles are retained at `/en/cv/full` and `/cv/full`. Other personal
pages have not been deleted. Compact navigation applies only to the main
academic routes; the wider site retains its existing menus.

## CV source and PDF

`src/data/academic-cv.json` supplies both web CVs, the English downloadable
PDF, and the assistant's current academic-profile context. Keep student status,
expected completion, project stages and contributions accurate. Do not infer a
BSc award date, publications, assessed software proficiency or doctoral status.
The public CV intentionally omits referee names/contact details.

After updating that source, regenerate the PDF from the repository root:

```sh
python scripts/build-academic-cv.py
pdftoppm -singlefile -scale-to 1600 -png public/assets/docs/Anton_Ebsen_Academic_CV.pdf tmp/pdfs/academic-cv
npm run test:unit
```

The generator requires `reportlab` and `pypdf`, uses no network access and
enforces one page. Inspect the PNG for wrapping, clipping and readability before
committing the source and PDF together. The unit tests check PDF text, page
count, stages, navigation and assistant context; browser tests check downloads,
accessibility, no-JavaScript access and retained extended profiles.

## Scope

See [the application-reader audit](application-reader-audit.md) for verified
contribution statements, the actual source-to-data example, repaired Danish
anchors, and bilingual one-page print checks. Group roles must be confirmed by
the author rather than inferred from a coauthored paper.

The demography paper itself is unchanged. The thesis and group AI proposal
remain private. A link to code is not a claim of validated replication: a
separate data-access and execution-order audit is needed before claiming that.
No Google Scholar, ORCID or other third-party profile is edited by this workflow.
