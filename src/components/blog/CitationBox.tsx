import React, { useState } from 'react';

interface CitationBoxProps {
    title: string;
    author: string;
    url: string;
    date: string;
}

export default function CitationBox({ title, author, url, date }: CitationBoxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    // Generate today's date for 'accessed' field in BibTeX
    const today = new Date().toISOString().split('T')[0];
    const year = new Date(date).getFullYear() || new Date().getFullYear();

    const bibtex = `@misc{ebsen${year},
  author = {${author}},
  title = {${title}},
  year = {${year}},
  url = {${url}},
  note = {Accessed: ${today}}
}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(bibtex);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-8 border-t border-b border-white/5 py-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-xs font-mono text-dim hover:text-accent transition-colors uppercase tracking-widest"
            >
                <i className={`fa-solid fa-quote-right ${isOpen ? 'text-accent' : ''}`}></i>
                {isOpen ? 'Close Citation' : 'Cite this Post'}
            </button>

            <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] mt-4 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden bg-[#0a0a0c] border border-white/10 rounded-lg relative group">
                    <button
                        onClick={copyToClipboard}
                        className="absolute top-2 right-2 px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] text-dim hover:text-white transition-colors border border-white/5"
                    >
                        {copied ? <span className="text-green-400"><i className="fa-solid fa-check mr-1"></i>Copied</span> : <span><i className="fa-regular fa-copy mr-1"></i>Copy BibTeX</span>}
                    </button>
                    <pre className="p-4 text-xs text-dim font-mono overflow-x-auto selection:bg-accent/20">
                        {bibtex}
                    </pre>
                </div>
            </div>
        </div>
    );
}
