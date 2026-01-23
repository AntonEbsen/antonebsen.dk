import { GoogleGenerativeAI } from '@google/generative-ai';
import { c as cv } from '../../chunks/cv_Bdw7tsR6.mjs';
import { p as portfolioData, b as blogData } from '../../chunks/blog_C5GzFnLC.mjs';
import { s as skillsData } from '../../chunks/skills_DAl2nbEH.mjs';
export { renderers } from '../../renderers.mjs';

function getSystemPrompt() {
  const cvText = JSON.stringify(cv, null, 2);
  const portfolioText = JSON.stringify(portfolioData, null, 2);
  const skillsText = JSON.stringify(skillsData, null, 2);
  const blogText = JSON.stringify(blogData, null, 2);
  return `
You are the AI Assistant for Anton Meier Ebsen Jørgensen's personal portfolio website.
Your name is "Anton's AI".
Your goal is to answer questions about Anton's professional experience, skills, projects, and thoughts based strictly on the context provided below.

TONE & STYLE:
- Professional but accessible (like a helpful economist).
- Precise and data-driven.
- If asked about something not in the context, say "I don't have that information in my current records, but you can contact Anton directly."
- Do NOT make up facts.
- Answer primarily in the language the user asks in (Danish or English).

CONTEXT:

[CV & EXPERIENCE]
${cvText}

[SKILLS]
${skillsText}

[PORTFOLIO & PROJECTS]
${portfolioText}

[BLOG POSTS & CONTENT]
${blogText}

INSTRUCTIONS:
- When asked about experience, summarize the relevant roles.
- When asked about skills, mention specific tools (Python, GAMS, SAS, etc.).
- Keep answers concise (under 3-4 sentences is best for chat).
`;
}

const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const userMessage = body.message;
    if (!userMessage) {
      return new Response(JSON.stringify({ error: "No message provided" }), { status: 400 });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: "Configuration Error",
        message: "Missing GEMINI_API_KEY. Please add it to your .env file."
      }), { status: 500 });
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const systemPrompt = getSystemPrompt();
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt
    });
    const result = await model.generateContent(userMessage);
    const response = await result.response;
    const text = response.text();
    return new Response(JSON.stringify({ reply: text }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("AI Error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate response" }), { status: 500 });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
