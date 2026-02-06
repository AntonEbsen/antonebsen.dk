import React, { useState } from 'react';

export default function ProjectBot({ projectTitle }: { projectTitle: string }) {
    const [visible, setVisible] = useState(true);

    return (
        <div style={{
            position: 'fixed',
            bottom: '100px',
            right: '10px',
            width: '120px',
            height: '120px',
            background: 'blue',
            color: 'white',
            zIndex: 2147483647,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            textAlign: 'center',
            cursor: 'pointer',
            border: '4px solid white'
        }} onClick={() => alert("I AM ALIVE")}>
            DEBUG BOT<br />(Click Me)
        </div>
    );
}
