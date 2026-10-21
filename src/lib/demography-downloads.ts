import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DEMOGRAPHY_PAPER, demographyBibtex } from '../data/demography-paper';

/** Called only by prerendered endpoints: no runtime dependence on public/. */
export function demographyPdfResponse() {
  const bytes = new Uint8Array(readFileSync(resolve('public' + DEMOGRAPHY_PAPER.sourcePdf)));
  return new Response(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="Ebsen_Jorgensen_2026_Bismarcks_Lost_Battle.pdf"',
    },
  });
}

export function demographyBibtexResponse() {
  return new Response(demographyBibtex(), {
    headers: {
      'Content-Type': 'application/x-bibtex; charset=utf-8',
      'Content-Disposition': 'attachment; filename="Jorgensen_2026_Bismarcks_Lost_Battle.bib"',
    },
  });
}
