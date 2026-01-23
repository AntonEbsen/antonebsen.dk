export const prerender = true;

export async function GET() {
    return new Response(
        JSON.stringify({
            buildTime: new Date().toISOString(),
            message: "If you see this, the deployment was successful."
        }),
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
}
