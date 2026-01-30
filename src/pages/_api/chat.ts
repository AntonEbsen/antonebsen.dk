import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { message, lang, persona } = body;

        // TODO: Integrate with real AI backend (OpenAI/Anthropic)
        // For now, return a mock response

        // Simulate latency
        await new Promise(resolve => setTimeout(resolve, 800));

        const responses = [
            "That's an interesting perspective on macroeconomics. Tell me more.",
            "Based on my experience with time-series data, I'd suggest checking for stationarity first.",
            "I can certainly help you structure that analysis. What's the target audience?",
            "If we look at the Keynesian cross model, this shift in consumption would have a multiplier effect."
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        // Stream response (mock)
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const chunks = randomResponse.split(" ");
                for (const chunk of chunks) {
                    controller.enqueue(encoder.encode(chunk + " "));
                    await new Promise(r => setTimeout(r, 50));
                }
                controller.close();
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked'
            },
            status: 200
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
