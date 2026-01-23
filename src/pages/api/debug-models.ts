
export const prerender = false;

export async function GET() {
    const apiKey = import.meta.env.GEMINI_API_KEY;
    if (!apiKey) {
        return new Response("Missing API Key", { status: 500 });
    }

    try {
        // Direct REST call to list models
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        return new Response(JSON.stringify(data, null, 2), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
