export const prerender = false;

export const POST = async (req: Request) => {
   return new Response("This is a hardcoded PONG from the server. If you see this, the API works.", {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
   });
};
