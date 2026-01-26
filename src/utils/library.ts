export interface Book {
    title: string;
    author: string;
    description: string;
    year?: string;
    coverColor: string; // CSS color or gradient class for the spine/cover
    tags: string[];
}

export const libraryBooks: Book[] = [
    {
        title: "Confessiones",
        author: "Augustine of Hippo",
        description: "En dybt personlig beretning om synd, omvendelse og Guds nåde. Den første selvbiografi i vestlig litteratur.",
        year: "397",
        coverColor: "bg-red-900",
        tags: ["biography", "classic", "repentance"]
    },
    {
        title: "Summa Theologica",
        author: "Thomas Aquinas",
        description: "Troens intellektuelle katedral. En systematisk gennemgang af teologi, filosofi og moral.",
        year: "1274",
        coverColor: "bg-amber-900",
        tags: ["theology", "philosophy", "classic"]
    },
    {
        title: "Orthodoxy",
        author: "G.K. Chesterton",
        description: "Et sprudlende forsvar for kristendommen som det mest spændende eventyr af alle.",
        year: "1908",
        coverColor: "bg-green-900",
        tags: ["apologetics", "philosophy"]
    },
    {
        title: "Mere Christianity",
        author: "C.S. Lewis",
        description: "En logisk og klar forklaring af hvad kristendom faktisk er, skrevet for det moderne menneske.",
        year: "1952",
        coverColor: "bg-blue-900",
        tags: ["apologetics", "classic"]
    },
    {
        title: "The Screwtape Letters",
        author: "C.S. Lewis",
        description: "En senior-dæmons breve til sin nevø. En mesterlig satire over fristelse og menneskelig natur.",
        year: "1942",
        coverColor: "bg-gray-800",
        tags: ["fiction", "psychology"]
    },
    {
        title: "Imitatio Christi",
        author: "Thomas à Kempis",
        description: "En håndbog i det indre liv. Om ydmyghed, tålmodighed og kærlighed til Jesus.",
        year: "1418",
        coverColor: "bg-stone-800",
        tags: ["devotional", "spirituality"]
    },
    {
        title: "Pensées",
        author: "Blaise Pascal",
        description: "Fragmenter af tanker om menneskets storhed og elendighed, og væddemålet om Guds eksistens.",
        year: "1670",
        coverColor: "bg-purple-900",
        tags: ["philosophy", "apologetics"]
    },
    {
        title: "The Everlasting Man",
        author: "G.K. Chesterton",
        description: "Historien om menneskeheden set gennem det kristne perspektiv. Bogen der omvendte C.S. Lewis.",
        year: "1925",
        coverColor: "bg-orange-900",
        tags: ["history", "apologetics"]
    }
];
