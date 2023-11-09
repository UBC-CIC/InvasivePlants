const boldText = (text) => {
    const regex = /\*\*(.*?)\*\*/g;
    return text.split(regex).map((chunk, index) => {
        if (index % 2 === 1) {
            return <b key={index}>{chunk}</b>;
        }
        return chunk;
    });
};

export default boldText;

