
import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';

export const prerender = false;

const links = [
    { title: "18-årig EU-kandidat fra Falster: Jeg vil være direkte talerør for de unge", source: "TV2 Øst", url: "https://www.tv2east.dk/sjaelland-og-oerne/18-arig-eu-kandidat-fra-falster-jeg-vil-vaere-direkte-taleror-de-unge", date: "2019-05-01" },
    { title: "Elever: Undervisningen har ikke den samme kvalitet", source: "Gymnasieskolen", url: "https://gymnasieskolen.dk/articles/elever-undervisningen-har-ikke-den-samme-kvalitet/", date: "2020-01-01" },
    { title: "Hvad skal huen bruges til?", source: "Folketidende", url: "https://www.folketidende.dk/guldborgsund/hvad-skal-huen-bruges-til/3032773", date: "2018-06-01" },
    { title: "Socialdemokrat blev EP-valgets højdespringer på Lolland-Falster", source: "Folketidende", url: "https://www.folketidende.dk/lokal-nyt/socialdemokrat-blev-ep-valgets-hojdespringer-pa-lolland-falster/3946559", date: "2019-05-27" },
    { title: "Tillykke til alle studenterne", source: "CELF", url: "https://www.celf.dk/tillykke-til-alle-studenterne/", date: "2018-06-25" },
    { title: "Europa står i flammer", source: "DR Nyheder", url: "https://www.dr.dk/nyheder/udland/morten-helveg-petersen-europa-staar-i-flammer-og-vi-har-brug-faelles-loesninger", date: "2019-05-01" },
    { title: "Det sidste ord: EU", source: "TV2 Øst", url: "https://www.tv2east.dk/folketingsvalg-2019-skal-mette-frederiksen-eller-lars-lokke-rasmussen-lede-danmark/det-sidste-ord-eu", date: "2019-05-01" },
    { title: "Kontakt - Økonomisk Institut", source: "KU", url: "https://www.econ.ku.dk/soes/kontakt/", date: "2023-01-01" },
    { title: "Europa-Parlamentsvalg 2019 Kandidater", source: "Altinget", url: "https://legacy.altinget.dk/kandidater/ep19/stemmeseddel.aspx", date: "2019-05-01" },
    { title: "Landssammenslutningen af Handelsskoleelever", source: "Wikipedia", url: "https://da.wikipedia.org/wiki/Landssammenslutningen_af_Handelsskoleelever#Oversigt_over_forretningsudvalg_og_andre_landsvalgte", date: "2018-01-01" },
    { title: "Hvem er de 135 danskere der kæmper om en plads", source: "DR Nyheder", url: "https://www.dr.dk/nyheder/politik/ep-valg/hvem-er-de-135-danskere-der-kaemper-om-en-plads-i-europa-parlamentet", date: "2019-05-01" }
];

export const GET: APIRoute = async () => {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let count = 0;
    const errors = [];

    for (const link of links) {
        const { error } = await supabase.from('media_mentions').insert([{
            title: link.title,
            source: link.source,
            url: link.url,
            date: link.date,
            visible: true
        }]);
        if (error) errors.push(error.message);
        else count++;
    }

    return new Response(JSON.stringify({ message: "Media migration done", count, errors }, null, 2));
};
