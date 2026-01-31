
(async () => {
    try {
        const res = await fetch('http://localhost:4321/api/chat', {
            method: 'POST',
            body: JSON.stringify({ message: 'Who is Anton?', lang: 'en' }),
            headers: { 'Content-Type': 'application/json' }
        });
        const json = await res.json();
        console.log("AI Reply:", json);
    } catch (e) {
        console.error(e);
    }
})();
