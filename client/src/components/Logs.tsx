import React from 'react';

interface LogsProps {
    feedbackMessages: string[]; 
}

const Logs: React.FC<LogsProps> = ({ feedbackMessages }) => {
    return (
        <div>
            {feedbackMessages.map((message, index) => (
                <p key={index}>{message}</p>
            ))}
        </div>
    );
};

export default Logs;