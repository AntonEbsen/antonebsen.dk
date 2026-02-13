import React from 'react';

interface Props {
    prompt: string;
    persona?: string;
    label?: string;
    className?: string;
}

export default function AIContextButton({ prompt, persona = 'recruiter', label = "Ask AI", className = "" }: Props) {

    const handleClick = () => {
        // Dispatch custom event that ChatWidget listens to
        window.dispatchEvent(new CustomEvent('anton:chat-open', {
            detail: {
                message: prompt,
                persona: persona
            }
        }));
    };

    return (
        <button
            onClick={handleClick}
            className={`inline-flex items-center gap-2 text-xs font-medium text-accent hover:text-white transition-colors bg-accent/10 hover:bg-accent/20 px-3 py-1.5 rounded-full border border-accent/20 ${className}`}
            title="Ask Anton's AI about this"
        >
            <i className="fa-solid fa-sparkles"></i>
            {label}
        </button>
    );
}
