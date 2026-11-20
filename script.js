
"use strict";

// ==========================================
// CRYPTEX - CLASSICAL CRYPTOGRAPHY SYSTEM
// ==========================================

const $ = id => document.getElementById(id);
const cipher = $("cipher");

const descriptions = {
    caesar: "Shifts each letter by a fixed number of positions in the alphabet.",
    atbash: "Reverses the alphabet. A becomes Z, B becomes Y, and so on.",
    vigenere: "Uses a keyword to apply different letter shifts.",
    railfence: "Arranges letters in a zigzag pattern across multiple rails.",
    rot13: "Shifts every letter by 13 positions.",

    substitution: "Replaces each letter using a secret 26-letter alphabet.",
    columnar: "Rearranges letters into columns according to a keyword."
    };

const keyHints = {
    caesar: "Enter a number, such as 3 or -2.",
    atbash: "No key required.",
    vigenere: "Enter an alphabetic keyword, such as LEMON.",
    railfence: "Enter the number of rails, such as 3.",
    rot13: "No key required.",
 
    substitution: "Enter all 26 English letters without repetition.",
    columnar: "Enter an alphabetic keyword, such as SECRET."
  
};

// ==========================================
// ALGORITHM INFORMATION
// ==========================================

function updateAlgorithmInfo() {
    const selected = cipher.value;

    $("algorithmDescription").textContent = descriptions[selected];
    $("encryptKeyHint").textContent = keyHints[selected];
    $("decryptKeyHint").textContent = keyHints[selected];

    const noKey = ["atbash", "rot13"].includes(selected);

    $("encryptKey").disabled = noKey;
    $("decryptKey").disabled = noKey;

    $("encryptKey").placeholder = noKey ? "No key required" : "Enter encryption key";
    $("decryptKey").placeholder = noKey ? "No key required" : "Enter decryption key";
}

cipher.addEventListener("change", () => {
    updateAlgorithmInfo();

    $("encryptKey").value = "";
    $("decryptKey").value = "";

    clearErrors();
});

updateAlgorithmInfo();

// ==========================================
// INPUT VALIDATION
// ==========================================

function validText(text) {
    return /^[a-zA-Z ]+$/.test(text);
}

function validateMessage(text) {
    if (!text.trim()) {
        throw new Error("Please enter a message.");
    }

    if (!validText(text)) {
        throw new Error("Only English letters and spaces are allowed.");
    }
}

function requireKey(value) {
    if (!value.trim()) {
        throw new Error("Please enter the required key.");
    }
}

function mod(n, m) {
    return ((n % m) + m) % m;
}

function gcd(a, b) {
    return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

function modularInverse(a, m) {
    for (let i = 1; i < m; i++) {
        if (mod(a * i, m) === 1) return i;
    }

    throw new Error("Invalid Affine key.");
}

function clearErrors() {
    [
        "encryptTextError",
        "encryptKeyError",
        "decryptTextError",
        "decryptKeyError"
    ].forEach(id => {
        $(id).textContent = "";
    });
}

// ==========================================
// CAESAR CIPHER
// ==========================================

function caesar(text, shift, decrypt = false) {
    if (!Number.isInteger(shift)) {
        throw new Error("Enter a valid whole-number shift.");
    }

    const movement = mod(decrypt ? -shift : shift, 26);

    return [...text].map(ch => {
        if (!/[a-z]/i.test(ch)) return ch;

        const base = ch === ch.toUpperCase() ? 65 : 97;

        return String.fromCharCode(
            mod(ch.charCodeAt(0) - base + movement, 26) + base
        );
    }).join("");
}

// ==========================================
// ATBASH CIPHER
// ==========================================

function atbash(text) {
    return [...text].map(ch => {
        if (!/[a-z]/i.test(ch)) return ch;

        const base = ch === ch.toUpperCase() ? 65 : 97;

        return String.fromCharCode(
            25 - (ch.charCodeAt(0) - base) + base
        );
    }).join("");
}

// ==========================================
// VIGENERE CIPHER
// ==========================================

function vigenere(text, keyword, decrypt = false) {
    if (!/^[a-zA-Z]+$/.test(keyword)) {
        throw new Error("Vigenere key must contain letters only.");
    }

    let index = 0;
    const key = keyword.toUpperCase();

    return [...text].map(ch => {
        if (!/[a-z]/i.test(ch)) return ch;

        const base = ch === ch.toUpperCase() ? 65 : 97;
        const shift = key.charCodeAt(index % key.length) - 65;

        index++;

        return String.fromCharCode(
            mod(
                ch.charCodeAt(0) - base + (decrypt ? -shift : shift),
                26
            ) + base
        );
    }).join("");
}

// ==========================================
// RAIL FENCE CIPHER
// ==========================================

function railFenceEncrypt(text, rails) {
    if (!Number.isInteger(rails) || rails < 2) {
        throw new Error("Enter at least 2 rails.");
    }

    const rows = Array.from({ length: rails }, () => []);

    let row = 0;
    let direction = 1;

    for (const ch of text) {
        rows[row].push(ch);

        if (row === 0) direction = 1;
        else if (row === rails - 1) direction = -1;

        row += direction;
    }

    return rows.map(r => r.join("")).join("");
}

function railFenceDecrypt(text, rails) {
    if (!Number.isInteger(rails) || rails < 2) {
        throw new Error("Enter at least 2 rails.");
    }

    const pattern = [];
    let row = 0;
    let direction = 1;

    for (let i = 0; i < text.length; i++) {
        pattern.push(row);

        if (row === 0) direction = 1;
        else if (row === rails - 1) direction = -1;

        row += direction;
    }

    const counts = Array(rails).fill(0);

    pattern.forEach(r => counts[r]++);

    const rows = [];
    let position = 0;

    counts.forEach(count => {
        rows.push(text.slice(position, position + count).split(""));
        position += count;
    });

    const indexes = Array(rails).fill(0);

    return pattern.map(r => rows[r][indexes[r]++]).join("");
}

// ==========================================
// ROT13 CIPHER
// ==========================================

function rot13(text) {
    return caesar(text, 13);
}


// ==========================================
// MONOALPHABETIC SUBSTITUTION
// ==========================================

function substitution(text, keyText, decrypt = false) {
    const key = keyText.toUpperCase();
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    if (!/^[A-Z]{26}$/.test(key) ||
        new Set(key).size !== 26) {
        throw new Error(
            "Enter all 26 English letters exactly once."
        );
    }

    return [...text].map(ch => {
        if (!/[a-z]/i.test(ch)) return ch;

        const base = ch === ch.toUpperCase() ? 65 : 97;
        const letter = ch.toUpperCase();

        const position = decrypt
            ? key.indexOf(letter)
            : alphabet.indexOf(letter);

        const result = decrypt
            ? alphabet[position]
            : key[position];

        return String.fromCharCode(result.charCodeAt(0) + base - 65);
    }).join("");
}

// ==========================================
// COLUMNAR TRANSPOSITION
// ==========================================

function getColumnOrder(keyword) {
    return [...keyword.toUpperCase()]
        .map((ch, index) => ({ ch, index }))
        .sort((a, b) =>
            a.ch.localeCompare(b.ch) || a.index - b.index
        )
        .map(item => item.index);
}

function columnarEncrypt(text, keyword) {
    if (!/^[a-zA-Z]+$/.test(keyword)) {
        throw new Error("Columnar key must contain letters only.");
    }

    const columns = keyword.length;
    const order = getColumnOrder(keyword);

    let output = "";

    order.forEach(col => {
        for (let i = col; i < text.length; i += columns) {
            output += text[i];
        }
    });

    return output;
}

function columnarDecrypt(text, keyword) {
    if (!/^[a-zA-Z]+$/.test(keyword)) {
        throw new Error("Columnar key must contain letters only.");
    }

    const columns = keyword.length;
    const rows = Math.ceil(text.length / columns);
    const remainder = text.length % columns;
    const order = getColumnOrder(keyword);

    const lengths = Array(columns).fill(rows);

    if (remainder !== 0) {
        for (let col = remainder; col < columns; col++) {
            lengths[col]--;
        }
    }

    const columnData = Array(columns);
    let position = 0;

    order.forEach(col => {
        columnData[col] = text.slice(
            position,
            position + lengths[col]
        ).split("");

        position += lengths[col];
    });

    let output = "";

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            if (columnData[c][r] !== undefined) {
                output += columnData[c][r];
            }
        }
    }

    return output;
}


// ==========================================
// MAIN CIPHER PROCESSOR
// ==========================================

function processCipher(text, selected, keyValue, decrypt = false) {

    switch (selected) {

        case "caesar":
            if (!/^[+-]?\d+$/.test(keyValue)) {
                throw new Error("Enter a valid Caesar shift number.");
            }

            return caesar(text, Number(keyValue), decrypt);

        case "atbash":
            return atbash(text);

        case "vigenere":
            requireKey(keyValue);
            return vigenere(text, keyValue, decrypt);

        case "railfence":
            if (!/^\d+$/.test(keyValue)) {
                throw new Error("Enter a valid number of rails.");
            }

            return decrypt
                ? railFenceDecrypt(text, Number(keyValue))
                : railFenceEncrypt(text, Number(keyValue));

        case "rot13":
            return rot13(text);

        

        case "substitution":
            requireKey(keyValue);
            return substitution(text, keyValue, decrypt);

        case "columnar":
            requireKey(keyValue);

            return decrypt
                ? columnarDecrypt(text, keyValue)
                : columnarEncrypt(text, keyValue);



        default:
            throw new Error("Please select a valid algorithm.");
    }
}

// ==========================================
// BEGINNER-FRIENDLY EXPLANATIONS
// ==========================================

const explanations = {

    caesar: {
        intro: "Imagine that the alphabet is a circular track. We move each letter forward or backward by a fixed number of places.",
        example: "With key 3: A becomes D, B becomes E, and C becomes F.",
        encryption: "We move every letter forward by the number given in the key.",
        decryption: "We move every letter backward by the number given in the key.",
        ending: "When we reach Z, we start again from A."
    },

    atbash: {
        intro: "Imagine writing the alphabet in two rows. The first row goes from A to Z, and the second goes backward from Z to A.",
        example: "A becomes Z, B becomes Y, C becomes X, and D becomes W.",
        encryption: "We replace every letter with its opposite letter in the reversed alphabet.",
        decryption: "We do exactly the same thing again. Atbash uses the same process for both operations.",
        ending: "Applying Atbash twice brings back the original message."
    },

    vigenere: {
        intro: "Imagine having several Caesar ciphers instead of just one. A secret keyword tells us how far to move each letter.",
        example: "If a message letter is A and its matching keyword letter is C, A moves forward by 2 places and becomes C.",
        encryption: "We write the keyword above the message. Each keyword letter tells us how many places to move the matching message letter.",
        decryption: "We use the same keyword but move each letter backward by the indicated number of places.",
        ending: "The keyword controls how the letters move. We repeat the keyword until the message ends."
    },

    railfence: {
        intro: "Imagine writing a message along a zigzag staircase. Instead of reading the message normally, we read one row at a time.",
        example: "With 3 rails and the message HELLOWORLD, the letters are arranged in a zigzag. Reading the rows gives HOL, ELWRD and LO.",
        encryption: "We write the letters in a zigzag pattern using the number of rails in the key. Then we read the top row first, followed by the other rows.",
        decryption: "We recreate the zigzag pattern, place the encrypted letters into the correct rows, and follow the zigzag path to recover the message.",
        ending: "The letters themselves do not change. Only their positions are rearranged."
    },

    rot13: {
        intro: "ROT13 is a special Caesar cipher. It always moves every letter forward by 13 places.",
        example: "A becomes N, B becomes O, C becomes P, and N becomes A.",
        encryption: "We move every letter forward by 13 places.",
        decryption: "We also move every letter forward by 13 places. Moving 13 places twice returns the original letter.",
        ending: "ROT13 does not need a key because the shift is always 13."
    },

    

    substitution: {
        intro: "Imagine creating your own secret alphabet. You decide which letter will replace each original letter.",
        example: "If A is assigned to Q in your secret alphabet, every A in the message becomes Q.",
        encryption: "We find each original letter in the normal alphabet and replace it with its matching letter in the secret alphabet.",
        decryption: "We search for each encrypted letter in the secret alphabet and find its original letter.",
        ending: "The secret alphabet must contain all 26 English letters without repetition."
    },

    columnar: {
        intro: "Imagine writing your message in a table and then reading the columns in a different order.",
        example: "With the keyword CAT, we read the column under A first, then C, and finally T.",
        encryption: "We write the message in rows under the keyword. Then we read the columns according to the alphabetical order of the keyword.",
        decryption: "We use the keyword to find the correct column order, fill the columns, and read the table row by row.",
        ending: "The letters do not change. Only their positions change."
    },

    
};

// ==========================================
// DISPLAY STEP-BY-STEP EXPLANATION
// ==========================================

function showExplanation(type, selected, original, output, keyValue) {

    const container = $("stepDetails");
    container.innerHTML = "";

    const info = explanations[selected];

    function addHeading(text) {
        const heading = document.createElement("h3");
        heading.className = "step-heading";
        heading.textContent = text;
        container.appendChild(heading);
    }

    function addStep(number, heading, content) {
        const div = document.createElement("div");
        div.className = "step-item";

        const title = document.createElement("strong");
        title.textContent = number + ". " + heading;

        const paragraph = document.createElement("p");
        paragraph.textContent = content;
        paragraph.style.marginTop = "6px";

        div.append(title, paragraph);
        container.appendChild(div);
    }

    addHeading("Let's understand " +
        cipher.options[cipher.selectedIndex].text + "!");

    const intro = document.createElement("p");
    intro.textContent = info.intro;
    intro.style.marginBottom = "15px";
    intro.style.color = "#64738a";
    container.appendChild(intro);

    addStep(
        1,
        "Your original message",
        original
    );

    addStep(
        2,
        "Our secret key",
        ["atbash", "rot13"].includes(selected)
            ? "This cipher does not need a key."
            : "The key we are using is: " + keyValue
    );

    addStep(
        3,
        "How does it work?",
        type === "Encryption"
            ? info.encryption
            : info.decryption
    );

    addStep(
        4,
        "A simple example",
        info.example
    );

    addStep(
        5,
        "Your result",
        "After applying the " +
        cipher.options[cipher.selectedIndex].text +
        " rules, we get: " + output
    );

    addStep(
        6,
        "Remember this!",
        info.ending
    );

    addStep(
        7,
        "In simple words",
        type === "Encryption"
            ? "We started with a readable message and used a secret method to turn it into a coded message."
            : "We started with a coded message and used the correct method and key to recover the readable message."
    );
}

// ==========================================
// ENCRYPTION
// ==========================================

$("encryptButton").addEventListener("click", () => {

    $("encryptTextError").textContent = "";
    $("encryptKeyError").textContent = "";

    try {
        const text = $("plainText").value;
        const keyValue = $("encryptKey").value.trim();
        const selected = cipher.value;

        validateMessage(text);

        if (!["atbash", "rot13"].includes(selected)) {
            requireKey(keyValue);
        }

        const output = processCipher(
            text,
            selected,
            keyValue,
            false
        );

        $("encryptedOutput").textContent = output;

        showExplanation(
            "Encryption",
            selected,
            text,
            output,
            keyValue
        );

    } catch (error) {
        if (!$("plainText").value.trim() ||
            !validText($("plainText").value)) {
            $("encryptTextError").textContent = error.message;
        } else {
            $("encryptKeyError").textContent = error.message;
        }
    }
});

// ==========================================
// DECRYPTION
// ==========================================

$("decryptButton").addEventListener("click", () => {

    $("decryptTextError").textContent = "";
    $("decryptKeyError").textContent = "";

    try {
        const text = $("cipherText").value;
        const keyValue = $("decryptKey").value.trim();
        const selected = cipher.value;

        validateMessage(text);

        if (!["atbash", "rot13"].includes(selected)) {
            requireKey(keyValue);
        }

        const output = processCipher(
            text,
            selected,
            keyValue,
            true
        );

        $("decryptedOutput").textContent = output;

        showExplanation(
            "Decryption",
            selected,
            text,
            output,
            keyValue
        );

    } catch (error) {
        if (!$("cipherText").value.trim() ||
            !validText($("cipherText").value)) {
            $("decryptTextError").textContent = error.message;
        } else {
            $("decryptKeyError").textContent = error.message;
        }
    }
});

// ==========================================
// COPY RESULTS
// ==========================================

async function copyResult(elementId) {

    const text = $(elementId).textContent;

    if (!text) {
        alert("There is no result to copy.");
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        alert("Result copied successfully.");
    } catch {
        const temp = document.createElement("textarea");
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();

        const copied = document.execCommand("copy");
        temp.remove();

        alert(copied
            ? "Result copied successfully."
            : "Copy failed. Please copy manually."
        );
    }
}

$("copyEncrypt").addEventListener("click", () => {
    copyResult("encryptedOutput");
});

$("copyDecrypt").addEventListener("click", () => {
    copyResult("decryptedOutput");
});

// ==========================================
// CLEAR ALL
// ==========================================

$("clearButton").addEventListener("click", () => {

    $("plainText").value = "";
    $("cipherText").value = "";

    $("encryptKey").value = "";
    $("decryptKey").value = "";

    $("encryptedOutput").textContent = "";
    $("decryptedOutput").textContent = "";

    clearErrors();

    $("stepDetails").innerHTML =
        '<p class="empty-message">Your explanation will appear here after an operation.</p>';
});

// ==========================================
// STRICT INPUT FILTERING
// ==========================================

// Messages: English letters and spaces only
["plainText", "cipherText"].forEach(id => {

    $(id).addEventListener("input", function () {

        const oldValue = this.value;

        this.value = oldValue.replace(/[^a-zA-Z ]/g, "");

    });

});

// Keys: filtering depends on selected algorithm
function filterKey(input) {

    const selected = cipher.value;

    switch (selected) {

        case "caesar":
            input.value = input.value.replace(/[^0-9+-]/g, "");
            break;

        case "railfence":
            input.value = input.value.replace(/[^0-9]/g, "");
            break;

        

        case "atbash":
        case "rot13":
            input.value = "";
            break;

        default:
            input.value = input.value.replace(/[^a-zA-Z]/g, "");
            break;
    }
}

["encryptKey", "decryptKey"].forEach(id => {

    $(id).addEventListener("input", function () {
        filterKey(this);
    });

});
