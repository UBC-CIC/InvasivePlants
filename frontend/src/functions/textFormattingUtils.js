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
    const strSplitUnderscore = str.split("_");
    const words = strSplitUnderscore.flatMap(word => word.split(" "));

    // Do not capitalize "of"
    return words.map(word => {
        const lowercaseWord = word.toLowerCase();
        if (lowercaseWord !== "of") {
            return word.charAt(0).toUpperCase() + word.slice(1);
        } else {
            return word;
        }
    }).join(' ');
}

// Split a string into an array of substrings based on commas and spaces
// (ex. "hello, world,good morning" => ["hello", "world", "good morning"]
export function splitStringByCommas(str) {
    return str.split(/,\s*|\s*,\s*/)
}

// Formats input to lowercase, replacing spaces with underscores 
// (ex. "Hello World, morning" or ["Hello World", "morning"] => ["hello_world", "morning"])
export function formatNames(names) {
    let formattedNames = [];

    if (typeof names === 'string') {
        formattedNames = splitStringByCommas(names).map(name => name.toLowerCase().replace(/\s+/g, '_'));
    } else if (Array.isArray(names)) {
        formattedNames = names.map(name => name.toLowerCase().replace(/\s+/g, '_'));
    }

    return formattedNames;
}

// Remove the text within parentheses and converts to lowercase (ex. "Hello (World)" => "hello")
export function removeTextInParentheses(input) {
    return input.replace(/\s*\([^)]*\)\s*/, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');
}