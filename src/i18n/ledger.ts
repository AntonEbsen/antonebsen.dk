/**
 * The Ledger — all display copy, in all three languages.
 *
 * Deliberately not in `ui.ts`: that file's `t()` helper is a flat dotted-key
 * lookup that only really works for strings, and this needs nested entries and
 * an ordered rank list.
 *
 * Deliberately not in `lib/gamification.ts` either — that module ships to the
 * client on every page, and inlining three languages of copy into it would both
 * bloat the bundle and freeze the language at build time. Components read from
 * here in frontmatter and hand the result to their client script as a JSON data
 * attribute, the same pattern CommandPalette already uses for its own strings.
 *
 * The register is archival rather than fantasy: the terms are real ones from
 * bookkeeping, chancery and guild practice. Where an English reference has a
 * local equivalent, the translation uses it — Domesday becomes Kong Valdemars
 * Jordebog in Danish and das Urbar in German, because those are what a reader
 * in each language would actually recognise.
 */

export type LedgerLang = 'da' | 'en' | 'de';

export interface LedgerEntryCopy {
    title: string;
    description: string;
}

export interface LedgerCopy {
    ui: {
        /** The book's name — the exact general-ledger term in each language. */
        title: string;
        eyebrow: string;
        intro: string;
        metaDescription: string;
        /** Unit of account. Only English inflects the plural. */
        marks: string;
        rank: string;
        nextRank: string;
        topRank: string;
        enrolled: string;
        notEnrolled: string;
        blankFolio: string;
        /** Closing total — the real term for the sum at the bottom of an account roll. */
        footOfAccount: string;
        entriesMade: string;
        toastEyebrow: string;
        close: string;
        storageNote: string;

        /**
         * The book curse, shown when a large selection is copied.
         *
         * Written in the site's own voice and attributed to nobody on purpose.
         * The famous "let it change into a serpent in his hand" curse is of
         * disputed provenance, and putting an unsourceable quotation with a
         * specific monastery and date onto an economic historian's site would
         * undo the work of removing the invented Bernanke and Lagarde footnotes.
         * A joke needs no citation; a citation needs to be true.
         */
        curse: string;
        curseFooter: string;

        /** Scriptorium mode: the way back out, always in Latin script. */
        scriptoriumNote: string;
        scriptoriumExit: string;

        /** Manicule margin marks. */
        markPassage: string;
        unmarkPassage: string;

        /** Sortes: the random-page action in the command palette. */
        sortes: string;
    };
    /**
     * Craft-guild progression topped by two crown offices, lowest first.
     * Index = rank - 1. A fixed tuple so a missing rank is a compile error;
     * ledger.test.ts separately checks the length against RANK_THRESHOLDS.
     */
    ranks: readonly [string, string, string, string, string, string, string, string];
    entries: Record<string, LedgerEntryCopy>;
}

export const ledgerCopy: Record<LedgerLang, LedgerCopy> = {
    da: {
        ui: {
            title: 'Hovedbogen',
            eyebrow: 'Protokol',
            intro: 'Enhver regnskabsbog har en side til det, der endnu ikke er sket. Denne fører protokol over, hvad en besøgende har foretaget sig her — indført efterhånden, linjeret og blankt indtil da.',
            metaDescription: 'En hovedbog over små ting, der er lagt mærke til. Indført efterhånden som de sker.',
            marks: 'mark',
            rank: 'Grad',
            nextRank: 'til',
            topRank: 'Bogen er ført til ende.',
            enrolled: 'Indført',
            notEnrolled: 'Ikke indført',
            blankFolio: 'Dette folio er blankt.',
            footOfAccount: 'Regnskabets fod',
            entriesMade: 'indført',
            toastEyebrow: 'Ført i hovedbogen',
            close: 'Luk hovedbogen',
            storageNote: 'Bogen ligger i din browser og ingen andre steder.',
            curse: 'Den, der bærer disse ord bort uden deres kilde: måtte hans regnskab aldrig gå op, måtte hans noter rådne, og måtte hvert tal, han citerer, være forkert med ét.',
            curseFooter: 'Teksten ligger på din udklipsholder alligevel. En henvisning ville være pænere.',
            scriptoriumNote: 'Sat med fraktur, som danske bogtrykkere gjorde til op i 1870erne.',
            scriptoriumExit: 'Tilbage til latinsk skrift',
            markPassage: 'Sæt en hånd i marginen her',
            unmarkPassage: 'Fjern hånden i marginen',
            sortes: 'Slå op på må og få'
        },
        // Lærling → Svend → Mester → Oldermand is the actual laugsvæsen ladder;
        // Rentemester and Rigshofmester were real Danish crown offices.
        ranks: ['Lærling', 'Svend', 'Mester', 'Oldermand', 'Møntmester', 'Rentemester', 'Rigshofmester', 'Rigsarkivar'],
        entries: {
            explorer:         { title: 'Skelgangen',              description: 'Gik skellet af: fem sider af godset opmålt.' },
            scholar:          { title: 'Lectio',                  description: 'Sad med én post i to minutter. Læste, ikke skimmede.' },
            economist:        { title: 'Prøven',                  description: 'Stillede rentekammeret et spørgsmål om Taylor-regler eller pengepolitik.' },
            recruiter:        { title: 'Anbefalingsbrevet',       description: 'Bad om tjenestefortegnelsen og fik den skrevet af.' },
            quiz_novice:      { title: 'Quodlibet',               description: 'Svarede på den første disputats. Alt må der spørges om.' },
            easter_egg:       { title: 'Marginalfiguren',         description: 'Fandt kruseduljen i marginen. Skrivere kedede sig også.' },
            globetrotter:     { title: 'Kartografen',             description: 'Drejede globussen og satte den kendte verden i bevægelse.' },
            timetraveler:     { title: 'Annalisten',              description: 'Læste årene i rækkefølge, det ene efter det andet.' },
            void_walker:      { title: 'Hic Sunt Dracones',       description: 'Gik ud over kortets kant. Her er drager.' },
            polyglot:         { title: 'Det tresprogede diplom',  description: 'Læste protokollen på alle tre tungemål.' },
            hacker:           { title: 'Skriverhånden',           description: 'Fremkaldte registret med tastetryk alene.' },
            night_owl:        { title: 'Vigilien',                description: 'Holdt nattetjenesten, mellem matutin og laudes.' },
            prompt_engineer:  { title: 'Disputatsen',             description: 'Fem replikker med skriveren. En ordentlig disput.' },
            data_miner:       { title: 'Jordebogen',              description: 'Tre eftersøgninger i arkivet. Kong Valdemars jordebog var også en opmåling.' },
            social_butterfly: { title: 'Brevvekslingen',          description: 'Fulgte tre tråde ud af arkivet.' },
            speed_demon:      { title: 'Ilbudet',                 description: 'Fem sider på et halvt minut. Ilbudet holder ikke hvil.' },
            pixel_perfect:    { title: 'Illuminatoren',           description: 'Ændrede folioens format for at se, om linjeringen holder.' },
            speaker:          { title: 'Herolden',                description: 'Talte højt, og blev hørt.' },

            reckoning:        { title: 'Opgørelsen',              description: 'Stillede tallene et spørgsmål og fik svar.' },
            colophon:         { title: 'Kolofonen',               description: 'Skrev henvisningen af, som en afskriver noterer sit forlæg.' },
            gloss:            { title: 'Glossen',                 description: 'Bad om en note til en enkelt linje i protokollen.' },
            visitation:       { title: 'Visitatsen',              description: 'Åbnede robusthedsprøven. Efterså regnskabet.' },
            explicit:         { title: 'Explicit',                description: 'Læste et stykke til sidste linje. Det ord skrev skriverne til slut.' },
            assize:           { title: 'Taksten',                 description: 'Satte satsen og så, hvad den kostede.' },
            variorum:         { title: 'Variorum',                description: 'Valgte én specifikation ud af fireogtres.' },
            stemma:           { title: 'Stemmaet',                description: 'Fulgte én tråd i vævet tilbage til dens udspring.' },
            attestation:      { title: 'Vitterligheden',          description: 'Satte sin hånd på brevet. Et brev er kun så godt som sine vidner.' },
            petition:         { title: 'Bønskriftet',             description: 'Stillede et spørgsmål i åbenhed og afventede svar.' },
            watermark:        { title: 'Vandmærket',              description: 'Holdt siden op mod lyset og fandt mærket.' },
            pilgrims_burden:  { title: 'Pilgrimsbyrden',          description: 'Fik oppakningen under en tiendedel af sin egen vægt.' },

            sortetryk:        { title: 'Sortetrykket',            description: 'Satte siden med fraktur, som danske bogtrykkere gjorde til op i 1870erne.' },
            anathema:         { title: 'Anathema',                description: 'Bar ordene bort uden deres kilde, og blev forbandet for det.' },
            manicule:         { title: 'Håndviseren',             description: 'Satte en hånd i marginen ud for et sted, der var værd at vende tilbage til.' },
            sortes:           { title: 'Sortes',                  description: 'Slog bogen op på må og få og læste, hvad der stod.' },
            apocryphon:       { title: 'Apokryfen',               description: 'Lagde mærke til, at regnskabet ikke gik op, og fandt det folio, bogen ikke ville vedkende sig.' }
        }
    },

    en: {
        ui: {
            title: 'The Ledger',
            eyebrow: 'The record',
            intro: 'Every account book has a page for things that have not happened yet. This one keeps a record of what a visitor has done here — entered as it occurs, ruled and blank until then.',
            metaDescription: 'A ledger of small things noticed. Entered as they occur.',
            marks: 'marks',
            rank: 'Rank',
            nextRank: 'to',
            topRank: 'The book is written up in full.',
            enrolled: 'Enrolled',
            notEnrolled: 'Not yet enrolled',
            blankFolio: 'This folio is blank.',
            footOfAccount: 'Foot of the account',
            entriesMade: 'entered',
            toastEyebrow: 'Entered in the ledger',
            close: 'Close the ledger',
            storageNote: 'The book is kept in your browser and nowhere else.',
            curse: 'Whoever carries these words away without their source: may his sums never balance, may his footnotes rot, and may every figure he quotes be out by one.',
            curseFooter: 'The text is on your clipboard all the same. A citation would be kinder.',
            scriptoriumNote: 'Set in Fraktur, as Danish printers did into the 1870s.',
            scriptoriumExit: 'Back to Latin script',
            markPassage: 'Put a hand in the margin here',
            unmarkPassage: 'Remove the hand from the margin',
            sortes: 'Open the book at random'
        },
        ranks: ['Apprentice', 'Journeyman', 'Master', 'Alderman', 'Master of the Mint', 'Lord Treasurer', 'Chancellor of the Exchequer', 'Master of the Rolls'],
        entries: {
            explorer:         { title: 'The Perambulation',        description: 'Walked the bounds: five pages of the estate surveyed.' },
            scholar:          { title: 'Lectio',                   description: 'Sat with one entry for two minutes. Reading, not skimming.' },
            economist:        { title: 'The Assay',                description: 'Put a question to the exchequer on Taylor rules or monetary policy.' },
            recruiter:        { title: 'Letters of Credence',      description: 'Called for the record of service and had it copied out.' },
            quiz_novice:      { title: 'The Quodlibet',            description: 'Answered the first disputation. Anything may be asked.' },
            easter_egg:       { title: 'The Marginal Grotesque',   description: 'Found the doodle in the margin. Scribes got bored too.' },
            globetrotter:     { title: 'The Cartographer',         description: 'Turned the globe and set the known world spinning.' },
            timetraveler:     { title: 'The Annalist',             description: 'Read the years in order, one after the next.' },
            void_walker:      { title: 'Hic Sunt Dracones',        description: 'Walked off the edge of the map. Here be dragons.' },
            polyglot:         { title: 'The Trilingual Charter',   description: 'Read the record in all three tongues.' },
            hacker:           { title: "The Scribe's Hand",        description: 'Summoned the index by keystroke alone.' },
            night_owl:        { title: 'The Vigil',                description: 'Kept the night office, between matins and lauds.' },
            prompt_engineer:  { title: 'The Disputation',          description: 'Five exchanges with the clerk. A proper argument.' },
            data_miner:       { title: 'The Inquest',              description: 'Three searches of the record. Domesday was an inquest too.' },
            social_butterfly: { title: 'The Correspondence',       description: 'Followed three threads out of the archive.' },
            speed_demon:      { title: 'Post Haste',               description: 'Five pages in half a minute. The courier does not linger.' },
            pixel_perfect:    { title: 'The Illuminator',          description: 'Resized the folio to see whether the ruling holds.' },
            speaker:          { title: 'The Herald',               description: 'Spoke aloud, and was heard.' },

            reckoning:        { title: 'The Reckoning',            description: 'Put a question to the data and got an answer back.' },
            colophon:         { title: 'The Colophon',             description: 'Took down the reference, as a copyist notes their source.' },
            gloss:            { title: 'The Gloss',                description: 'Asked for a note on a single line of the record.' },
            visitation:       { title: 'The Visitation',           description: 'Opened the robustness check. Inspected the accounts.' },
            explicit:         { title: 'The Explicit',             description: 'Read a piece to its last line. Scribes wrote that word at the end.' },
            assize:           { title: 'The Assize',               description: 'Set the rate and watched what it cost.' },
            variorum:         { title: 'The Variorum',             description: 'Picked one specification out of sixty-four.' },
            stemma:           { title: 'The Stemma',               description: 'Traced one thread of the web back to its source.' },
            attestation:      { title: 'The Attestation',          description: 'Set a hand to the charter. A charter is only as good as its witnesses.' },
            petition:         { title: 'The Petition',             description: 'Put a question in the open, and waited on an answer.' },
            watermark:        { title: 'The Watermark',            description: 'Held the page to the light and found the mark.' },
            pilgrims_burden:  { title: "The Pilgrim's Burden",     description: 'Got the pack under a tenth of your own weight.' },

            sortetryk:        { title: 'The Black Letter',         description: 'Set the page in Fraktur, as Danish printers did into the 1870s.' },
            anathema:         { title: 'Anathema',                 description: 'Carried the words away without their source, and was cursed for it.' },
            manicule:         { title: 'The Manicule',             description: 'Put a hand in the margin beside something worth returning to.' },
            sortes:           { title: 'Sortes',                   description: 'Opened the book at random and read whatever was there.' },
            apocryphon:       { title: 'The Apocryphon',           description: 'Noticed the account did not balance, and found the folio the book would not admit to.' }
        }
    },

    de: {
        ui: {
            title: 'Das Hauptbuch',
            eyebrow: 'Die Aufzeichnung',
            intro: 'Jedes Rechnungsbuch hat eine Seite für das, was noch nicht geschehen ist. Dieses führt Buch darüber, was ein Besucher hier getan hat — eingetragen, sobald es geschieht, liniert und leer bis dahin.',
            metaDescription: 'Ein Hauptbuch über kleine bemerkte Dinge. Eingetragen, sobald sie geschehen.',
            marks: 'Mark',
            rank: 'Rang',
            nextRank: 'bis',
            topRank: 'Das Buch ist vollständig geführt.',
            enrolled: 'Eingetragen',
            notEnrolled: 'Noch nicht eingetragen',
            blankFolio: 'Dieses Folio ist leer.',
            footOfAccount: 'Fuß der Rechnung',
            entriesMade: 'eingetragen',
            toastEyebrow: 'Ins Hauptbuch eingetragen',
            close: 'Das Hauptbuch schließen',
            storageNote: 'Das Buch liegt in Ihrem Browser und sonst nirgends.',
            curse: 'Wer diese Worte ohne ihre Quelle davonträgt: möge seine Rechnung nie aufgehen, mögen seine Anmerkungen verfaulen, und möge jede Zahl, die er zitiert, um eins danebenliegen.',
            curseFooter: 'Der Text liegt trotzdem in Ihrer Zwischenablage. Ein Nachweis wäre freundlicher.',
            scriptoriumNote: 'In Fraktur gesetzt, wie es dänische Drucker bis in die 1870er taten.',
            scriptoriumExit: 'Zurück zur lateinischen Schrift',
            markPassage: 'Eine Hand an den Rand setzen',
            unmarkPassage: 'Die Hand vom Rand entfernen',
            sortes: 'Das Buch aufs Geratewohl aufschlagen'
        },
        // Reichsschatzmeister rather than Reichshofmeister: a treasury office,
        // parallel to the English, not a court one.
        ranks: ['Lehrling', 'Geselle', 'Meister', 'Ältermann', 'Münzmeister', 'Rentmeister', 'Reichsschatzmeister', 'Reichsarchivar'],
        entries: {
            explorer:         { title: 'Der Grenzumgang',           description: 'Ging die Grenze ab: fünf Seiten des Guts vermessen.' },
            scholar:          { title: 'Lectio',                    description: 'Zwei Minuten bei einem Eintrag geblieben. Gelesen, nicht überflogen.' },
            economist:        { title: 'Die Probe',                 description: 'Der Kammer eine Frage zu Taylor-Regeln oder Geldpolitik gestellt.' },
            recruiter:        { title: 'Das Beglaubigungsschreiben', description: 'Das Dienstverzeichnis angefordert und abschreiben lassen.' },
            quiz_novice:      { title: 'Das Quodlibet',             description: 'Die erste Disputation beantwortet. Gefragt werden darf alles.' },
            easter_egg:       { title: 'Die Drolerie',              description: 'Die Kritzelei am Rand gefunden. Auch Schreiber langweilten sich.' },
            globetrotter:     { title: 'Der Kartograph',            description: 'Den Globus gedreht und die bekannte Welt in Bewegung gesetzt.' },
            timetraveler:     { title: 'Der Annalist',              description: 'Die Jahre der Reihe nach gelesen, eines nach dem anderen.' },
            void_walker:      { title: 'Hic Sunt Dracones',         description: 'Über den Rand der Karte hinausgegangen. Hier sind Drachen.' },
            polyglot:         { title: 'Die dreisprachige Urkunde', description: 'Die Aufzeichnung in allen drei Zungen gelesen.' },
            hacker:           { title: 'Die Schreiberhand',         description: 'Das Register allein durch Tastendruck herbeigerufen.' },
            night_owl:        { title: 'Die Vigil',                 description: 'Das Nachtoffizium gehalten, zwischen Matutin und Laudes.' },
            prompt_engineer:  { title: 'Die Disputation',           description: 'Fünf Wechselreden mit dem Schreiber. Ein ordentlicher Streit.' },
            data_miner:       { title: 'Das Urbar',                 description: 'Dreimal die Aufzeichnung durchsucht. Auch das Urbar war eine Erhebung.' },
            social_butterfly: { title: 'Der Briefwechsel',          description: 'Drei Fäden aus dem Archiv heraus verfolgt.' },
            speed_demon:      { title: 'Der Eilbote',               description: 'Fünf Seiten in einer halben Minute. Der Eilbote hält nicht.' },
            pixel_perfect:    { title: 'Der Illuminator',           description: 'Das Folioformat geändert, um zu sehen, ob die Linierung hält.' },
            speaker:          { title: 'Der Herold',                description: 'Laut gesprochen, und gehört worden.' },

            reckoning:        { title: 'Die Abrechnung',           description: 'Den Zahlen eine Frage gestellt und eine Antwort erhalten.' },
            colophon:         { title: 'Das Kolophon',             description: 'Den Nachweis abgeschrieben, wie ein Kopist seine Vorlage vermerkt.' },
            gloss:            { title: 'Die Glosse',               description: 'Um eine Anmerkung zu einer einzelnen Zeile gebeten.' },
            visitation:       { title: 'Die Visitation',           description: 'Die Robustheitsprüfung geöffnet. Die Rechnung nachgesehen.' },
            explicit:         { title: 'Explicit',                 description: 'Ein Stück bis zur letzten Zeile gelesen. Das Wort schrieben Schreiber ans Ende.' },
            assize:           { title: 'Die Taxe',                 description: 'Den Satz festgelegt und gesehen, was er kostet.' },
            variorum:         { title: 'Das Variorum',             description: 'Eine Spezifikation aus vierundsechzig ausgewählt.' },
            stemma:           { title: 'Das Stemma',               description: 'Einen Faden des Netzes bis zu seinem Ursprung verfolgt.' },
            attestation:      { title: 'Die Zeugenschaft',         description: 'Die Hand an die Urkunde gelegt. Eine Urkunde taugt nur so viel wie ihre Zeugen.' },
            petition:         { title: 'Die Bittschrift',          description: 'Eine Frage öffentlich gestellt und auf Antwort gewartet.' },
            watermark:        { title: 'Das Wasserzeichen',        description: 'Die Seite gegen das Licht gehalten und das Zeichen gefunden.' },
            pilgrims_burden:  { title: 'Die Pilgerlast',           description: 'Das Gepäck unter ein Zehntel des eigenen Gewichts gebracht.' },

            sortetryk:        { title: 'Der Fraktursatz',          description: 'Die Seite in Fraktur gesetzt, wie es dänische Drucker bis in die 1870er taten.' },
            anathema:         { title: 'Anathema',                 description: 'Die Worte ohne ihre Quelle davongetragen und dafür verflucht worden.' },
            manicule:         { title: 'Die Hand',                 description: 'Eine Hand an den Rand gesetzt, neben eine Stelle, die eine Rückkehr wert ist.' },
            sortes:           { title: 'Sortes',                   description: 'Das Buch aufs Geratewohl aufgeschlagen und gelesen, was dort stand.' },
            apocryphon:       { title: 'Das Apokryphon',           description: 'Bemerkt, dass die Rechnung nicht aufging, und das Folio gefunden, zu dem sich das Buch nicht bekannte.' }
        }
    }
};

/** Copy for a language, falling back to Danish (the site's default locale). */
export function getLedgerCopy(lang: string): LedgerCopy {
    return ledgerCopy[lang as LedgerLang] ?? ledgerCopy.da;
}
