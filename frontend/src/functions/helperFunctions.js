export function boldText(text) {
    const regex = /\*\*(.*?)\*\*/g;
    const parts = text.split(regex);

    return parts.map((chunk, index) => {
        if (index % 2 === 1) {
            return <b key={index}>{chunk}</b>;
        }
        return chunk;
    });
}

