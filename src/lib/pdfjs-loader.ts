/**
 * pdf.js, loaded the moment a visitor picks a PDF and not before.
 *
 * Both chat surfaces used to pull it in with a blocking `<script src>` from cdnjs —
 * ChatWidget is in BaseLayout, so that was every page on the site waiting on a
 * third-party CDN before the deferred scripts (the hero's scroll reveal among them)
 * could run. The only thing that needs it is the file picker's PDF branch.
 */
const PDFJS_VERSION = '3.11.174';
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

type PdfJsLib = {
    GlobalWorkerOptions: { workerSrc: string };
    getDocument(src: { data: ArrayBuffer }): { promise: Promise<any> };
};

let loading: Promise<PdfJsLib> | null = null;

export function ensurePdfJs(): Promise<PdfJsLib> {
    const existing = (window as any).pdfjsLib as PdfJsLib | undefined;
    if (existing) return Promise.resolve(existing);

    if (!loading) {
        loading = new Promise<PdfJsLib>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `${PDFJS_CDN}/pdf.min.js`;
            script.async = true;
            script.onload = () => {
                const lib = (window as any).pdfjsLib as PdfJsLib | undefined;
                if (!lib) {
                    loading = null;
                    reject(new Error('pdf.js loaded but did not register itself'));
                    return;
                }
                lib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`;
                resolve(lib);
            };
            script.onerror = () => {
                loading = null;
                reject(new Error('pdf.js failed to load'));
            };
            document.head.appendChild(script);
        });
    }
    return loading;
}

/** Every page's text, in reading order, joined with newlines. */
export async function extractPdfText(file: File): Promise<string> {
    const pdfjsLib = await ensurePdfJs();
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + '\n';
    }
    return text;
}
