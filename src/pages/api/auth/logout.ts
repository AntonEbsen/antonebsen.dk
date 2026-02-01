import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ cookies }) => {
    cookies.delete("auth_token", { path: "/" });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
}
