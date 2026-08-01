import { getCollection } from 'astro:content';
import { TRACK_HEX } from '@lib/video-feed';

export const prerender = false; // We want it to build dynamically if needed, or static if prerendered

export async function GET() {
    const nodes: any[] = [];
    const links: any[] = [];
    const addedNodeIds = new Set<string>();

    const addNode = (id: string, group: number, val: number, color: string, data: any = {}) => {
        if (!addedNodeIds.has(id)) {
            addedNodeIds.add(id);
            nodes.push({ id, group, val, color, ...data });
        }
    };

    // Groups:
    // 1: Books (Gold)
    // 2: Authors/Influences (Blue)
    // 3: Categories (Green)
    // 4: Videos (Red)

    // Fetch collections
    const books = await getCollection('books');
    const influences = await getCollection('influences');
    const videos = await getCollection('videos');

    // Add Influences (Authors/Thinkers)
    influences.forEach(inf => {
        const name = inf.data.name;
        addNode(name, 2, 15, '#60A5FA', { title: inf.data.role, desc: inf.data.impact });
        
        // Add Category as a hub node
        const category = inf.data.category;
        if (category) {
            addNode(category, 3, 20, '#34D399');
            links.push({ source: name, target: category, value: 2 });
        }
    });

    // Add Books
    books.forEach(book => {
        const title = book.data.title;
        const author = book.data.author;
        
        // Some placeholder books might have "Titel på bog", ignore them if we want, or just add them
        if (title.includes("Titel på bog")) return;

        addNode(title, 1, 10, '#D4794F', { desc: book.data.note, period: book.data.period });
        
        if (author) {
            // Ensure author node exists even if not in influences collection
            addNode(author, 2, 15, '#60A5FA', { title: "Author" });
            links.push({ source: title, target: author, value: 5 });
        }
    });

    // Add Videos, hung off the channel's two tracks and their series.
    // Colours are literals because these feed three.js, which cannot read CSS
    // variables — TRACK_HEX mirrors --accent-2 / --accent.
    videos.forEach(video => {
        const title = video.data.title;
        const trackHex = TRACK_HEX[video.data.track];

        addNode(title, 4, 10, trackHex, {
            title: 'Video',
            desc: video.data.description,
            url: `/en/videos/${video.id.replace(/\.json$/, '')}`
        });

        const track = video.data.track === 'hiking' ? 'Hiking' : 'Economics';
        addNode(track, 3, 20, trackHex);
        links.push({ source: title, target: track, value: 2 });

        if (video.data.series) {
            addNode(video.data.series, 3, 14, trackHex);
            links.push({ source: title, target: video.data.series, value: 3 });
        }
    });

    return new Response(JSON.stringify({ nodes, links }), {
        headers: {
            'Content-Type': 'application/json'
        }
    });
}
