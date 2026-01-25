export interface Verse {
    text: string;
    citation: string;
}

export const verses: Verse[] = [
    { text: "Herren er min hyrde, jeg lider ingen nød.", citation: "Salme 23:1" },
    { text: "Vær stille hos Gud, min sjæl, for fra ham kommer mit håb.", citation: "Salme 62:6" },
    { text: "Jeg er verdens lys. Den, der følger mig, skal aldrig vandre i mørket.", citation: "Johannes 8:12" },
    { text: "Kom til mig, alle I, som slider og slæber, så vil jeg give jer hvile.", citation: "Matthæus 11:28" },
    { text: "Salige er de, som stifter fred, for de skal kaldes Guds børn.", citation: "Matthæus 5:9" },
    { text: "Tro er fast tillid til det, der håbes på, overbevisning om det, der ikke ses.", citation: "Hebræerne 11:1" },
    { text: "I begyndelsen var Ordet, og Ordet var hos Gud, og Ordet var Gud.", citation: "Johannes 1:1" },
    { text: "Kærligheden er tålmodig, kærligheden er mild, den misunder ikke.", citation: "1. Korinther 13:4" },
    { text: "Frygt ikke, for jeg er med dig, fortvivl ikke, for jeg er din Gud.", citation: "Esajas 41:10" },
    { text: "Bed, så skal der gives jer; søg, så skal I finde; bank på, så skal der lukkes op for jer.", citation: "Matthæus 7:7" },
    { text: "Hvad hjælper det et menneske at vinde hele verden, men bøde med sin sjæl?", citation: "Matthæus 16:26" },
    { text: "Fred efterlader jeg jer, min fred giver jeg jer.", citation: "Johannes 14:27" },
    { text: "Vær stærke og modige, frygt ikke, for Herren din Gud er med dig.", citation: "Josvabogen 1:9" },
    { text: "Herren er nær ved dem, hvis hjerte er knust.", citation: "Salme 34:19" },
    { text: "Alt formår jeg i ham, der giver mig kraft.", citation: "Filipperne 4:13" },
    { text: "Vær ikke bekymrede for noget, men bring i alle forhold jeres ønsker frem for Gud i bøn.", citation: "Filipperne 4:6" },
    { text: "Så bliver da tro, håb, kærlighed, disse tre. Men størst af dem er kærligheden.", citation: "1. Korinther 13:13" },
    { text: "Den, der ikke elsker, kender ikke Gud, for Gud er kærlighed.", citation: "1. Johannes 4:8" },
    { text: "Jeg er opstandelsen og livet; den, der tror på mig, skal leve, om han end dør.", citation: "Johannes 11:25" },
    { text: "Også om jeg vandrer i dødsskyggens dal, frygter jeg intet ondt, for du er med mig.", citation: "Salme 23:4" },
];

export function getDailyVerse(): Verse {
    // Seed by date to ensure same verse for 24 hours
    const today = new Date();
    const seed = today.getFullYear() * 1000 + (today.getMonth() + 1) * 100 + today.getDate();
    const index = seed % verses.length;
    return verses[index];
}

export function getRandomVerse(): Verse {
    const index = Math.floor(Math.random() * verses.length);
    return verses[index];
}
