/**
 * One record per person, shared by every page that renders a CollaboratorSpotlight.
 *
 * These used to be copied by hand into nine separate .astro files, which is how
 * Jonas ended up with two different spellings of his name on the same site. Pages
 * spread a record and layer the project-specific bits on top:
 *
 *   collaborators: [
 *     { ...jonas, role: "Medforfatter", description: "Skrev velfærdsregime…" },
 *     { ...sheng, role: "Medforfatter", description: "Skrev litteraturgennemgangen…" }
 *   ]
 *
 * Identity (name, avatar, links) lives here; role and description stay with the
 * project, because what someone contributed differs from paper to paper.
 *
 * Note this is the person's name, which is not always how a given paper credits
 * them — the welfare seminar's title page prints "Jonas Skov Nielsen", so that
 * paper's citation string keeps that form.
 */

export interface PersonLinks {
    linkedin?: string;
    github?: string;
    website?: string;
}

export interface Person {
    name: string;
    image: string;
    links?: PersonLinks;
}

/** Shape actually consumed by CollaboratorSpotlight, once a page adds its own context. */
export interface Collaborator extends Person {
    role?: string;
    description?: string;
    status?: { text: string; color: 'green' | 'red' | 'blue' | 'yellow' };
}

// Anton's avatar is deliberately absent: team.astro runs the source image through
// getImage() so the island gets an optimised webp rather than the 785 KB original.
export const anton: Omit<Person, 'image'> = {
    name: "Anton M. E. Jørgensen",
    links: {
        linkedin: "https://linkedin.com/in/antonebsen",
        github: "https://github.com/AntonEbsen"
    }
};

export const sheng: Person = {
    name: "Sheng Ye Michael Chen",
    image: "/assets/collaborators/sheng.jpg",
    links: {
        linkedin: "https://www.linkedin.com/in/sheng-ye-michael-chen-a52595275/",
        github: "https://github.com/nsr708"
    }
};

export const jonas: Person = {
    name: "Jonas Amasa Skov Nielsen",
    image: "/assets/collaborators/jonas.jpg",
    links: {
        linkedin: "https://www.linkedin.com/in/jonas-amasa-skov-nielsen-aa0431357/",
        github: "https://github.com/JonasASNielsen"
    }
};

// HHX project partners. No public profiles to link, hence the shared placeholder avatar.
export const noah: Person = {
    name: "Noah Hjorth Berge",
    image: "/assets/collaborators/avatar.svg"
};

export const marius: Person = {
    name: "Marius Bruun Hansen",
    image: "/assets/collaborators/avatar.svg"
};

export const peter: Person = {
    name: "Peter Frandsen",
    image: "/assets/collaborators/avatar.svg"
};

export const elias: Person = {
    name: "Elias Walther Børresen",
    image: "/assets/collaborators/avatar.svg"
};
