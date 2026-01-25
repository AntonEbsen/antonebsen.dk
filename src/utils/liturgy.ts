export type LiturgicalColor = 'green' | 'purple' | 'white' | 'red' | 'black' | 'rose';

export interface LiturgicalSeason {
    name: string; // Danish name
    color: LiturgicalColor;
    description: string;
}

export function getLiturgicalSeason(date: Date = new Date()): LiturgicalSeason {
    const year = date.getFullYear();
    const easter = getEasterDate(year);

    // Advent: 4th Sunday before Christmas
    const christmas = new Date(year, 11, 25); // Dec 25
    const adventStart = new Date(christmas);
    adventStart.setDate(christmas.getDate() - (christmas.getDay() + 21)); // Approx logic

    // Lent: Ash Wednesday (46 days before Easter)
    const ashWednesday = new Date(easter);
    ashWednesday.setDate(easter.getDate() - 46);

    // Pentecost: 50 days after Easter
    const pentecost = new Date(easter);
    pentecost.setDate(easter.getDate() + 49);

    const now = date.getTime();

    // 1. ADVENT (Purple)
    if (now >= adventStart.getTime() && now < christmas.getTime()) {
        return {
            name: "Advent",
            color: 'purple',
            description: "Ventetiden. Vi forbereder os på Kristi komme i ydmyghed og bod."
        };
    }

    // 2. CHRISTMAS (White)
    const epiphany = new Date(year + 1, 0, 6); // Jan 6
    if (now >= christmas.getTime() || (date.getMonth() === 0 && date.getDate() <= 6)) {
        return {
            name: "Juletiden",
            color: 'white',
            description: "Glæden over Guds inkarnation. Kristus er født!"
        };
    }

    // 3. LENT (Purple)
    if (now >= ashWednesday.getTime() && now < easter.getTime()) {
        if (now >= easter.getTime() - (7 * 24 * 60 * 60 * 1000)) {
            // Holy Week (Red/Purple? Usually Red for Palms/Friday, White for Thursday.. simpler to keep Purple/Red mix)
            return {
                name: "Den Stille Uge",
                color: 'purple',
                description: "Vi vandrer med Jesus mod korset og graven."
            }
        }
        return {
            name: "Fasten",
            color: 'purple',
            description: "40 dage i ørkenen. Bøn, faste og almisse."
        };
    }

    // 4. EASTER (White)
    if (now >= easter.getTime() && now <= pentecost.getTime()) {
        return {
            name: "Påsketiden",
            color: 'white',
            description: "Han er opstanden! Døden er overvundet. Alleluia!"
        };
    }

    // 5. PENTECOST (Red) - Just the day/week? Let's say the day.
    if (isSameDay(date, pentecost)) {
        return {
            name: "Pinse",
            color: 'red',
            description: "Helligånden kommer. Kirkens fødselsdag."
        };
    }

    // 6. ORDINARY TIME (Green)
    return {
        name: "Almindelig Tid",
        color: 'green',
        description: "Kirken vokser. Vi lever i troen i hverdagen."
    };
}

// Gauss Algorithm for Easter Date
function getEasterDate(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month, day);
}

function isSameDay(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}
