/***************** HELPER FUNCTIONS *****************/

// Bolds text between two asterisks (ex. **BOLDED**)
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

// Capitalizes the first letter and the rest to lowercase in a string (ex. gypsophila_paniculata => Gypsophila paniculata)
export function capitalizeFirstWord(str) {
    const strSplitUnderscore = str.split("_");
    const words = strSplitUnderscore.flatMap(word => word.split(" "));

    const formattedWords = words.map((word, index) => {
        if (index === 0) { // first "word"
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return word.toLowerCase();
    });

    return formattedWords.join(" ");
}

// Capitalizes first letter of each word in a string (ex. gypsophila_paniculata => Gypsophila Paniculata)
export function capitalizeEachWord(str) {
    return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Formats a string by spliting it based on commas and spacces
export function formatString(str) {
    return str.split(/,\s*|\s*,\s*/)
}