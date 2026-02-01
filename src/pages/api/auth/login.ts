import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const body = await request.json();
        const password = body.password;

        // Use environment variable or default fallback
        const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD || "quantum";

        if (password === ADMIN_PASSWORD) {
            // Set secure, HTTP-only cookie
            cookies.set("auth_token", "authorized_session", {
                path: "/",
                httpOnly: true, // Not accessible via JS
                secure: import.meta.env.PROD, // Only secure in production (HTTPS)
                sameSite: "strict",
                maxAge: 60 * 60 * 24 * 7 // 7 days
            });

            return new Response(JSON.stringify({ success: true }), { status: 200 });
        } else {
            return new Response(JSON.stringify({ error: "Invalid password" }), { status: 401 });
        }
    } catch (e) {
        return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
    }
}
