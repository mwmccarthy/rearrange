const dataObj = { "skills": {} };
const input = document.getElementById("input");
const addButton = document.getElementById("add");
const rankedBox = document.getElementById("rankedbox");
const niceBox = document.getElementById("nicebox");
const datalist = document.getElementById("datalist");
const skillsList = document.getElementById("skills_list");
const error = document.getElementById("error");

// generate n digit numbers in base b which sum to s
function* nDigitsSumToS(n, s, b, res = 0) {
    if (n == 0 && s == 0) {
        yield res;
    }
    else if (n > 0 && s >= 0) {
        for (let d = 0; d < b && s - d >= 0; d++) {
            yield* nDigitsSumToS(n - 1, s - d, b, b * res + d);
        }
    }
}

// get digit of number n in position p where p is an exponent of the base b
function getDigit(n, p, b) {
    return Math.floor(n / b**p) % b;
}

// http://bonuses.irreducible.org/formulas.php
//
// A rearrange will be encoded as a five digit hexadecimal number such that each digit represents a stat.
// The stats used by a skill are likewise encoded as hexadecimal.
//
// For example:
// A rearrange of { con: 10, dex: 17, int: 10, str: 20, wis: 8 } is encoded as 0x292c0
// The stats for heavy-sword (CDSSS) are encoded as 0x11030
//
// The corresponding digits of these two numbers can be extracted by taking the
// remainder after division by the appropriate power of 16.
//
// In order to produce the product used in the stat multiplicator formula,
// for the given example rearrange and skill, add 8 to each digit of the
// rearrange and raise it to the power of the corresponding digit for
// the skill, then take the product of every result:
//
// (8 + 2)^1 * (8 + 9)^1 * (8 + 2)^0 * (8 + 12)^3 * (8 + 0)^0 = 10 * 17 * 20 * 20 * 20
function statMultiplicator(sk, re) {
    const product = Array.from({length: 5}, function(_, i) {
        return (getDigit(re, i, 16) + 8)**getDigit(sk, i, 16);
    }).reduce((n, acc) => acc * n);
    return 5 * Math.log(product) / 49 - 1/4;
}

// Rearranging in Discworld MUD is equivalent to the problem in combinatorics of
// putting 25 indistinct balls into 5 distinct bins each with capacity 15.
// This also happens to be equivalent to the problem of finding all five-digit
// hexadecimal numbers whose digits sum to 25. Therefore, we can generate all
// such numbers and they will each encode a uniqe rearrange.
function updateRearrange() {
    const rearranges = nDigitsSumToS(5, 25, 16);
    const skills = Array.from(document.querySelectorAll("li.list_item > span")).map(s => s.innerText);
    if (skills.length < 1) return;
    let best = 0;
    let winner;
    const deps = skills.map(sk => sk.split(".").reduce((obj, prop) => obj[prop], dataObj.skills).statDeps);
    checkre: for (const re of rearranges) {
        const weightings = deps.map(dep => statMultiplicator(dep, re));
        const ranked = weightings.reduce((a, b, i) => a && b > (weightings[i+1] || 0), true);
        if (rankedBox.checked && !ranked) continue checkre;
        const avg = weightings.reduce((cma, w, i) => cma + (w - cma)/(i + 1));
        if (avg > best) {
            winner = re;
            best = avg;
        }
    }
    ["wis", "str", "int", "dex", "con"].forEach(function(stat, i) {
        document.getElementById(stat).innerText = winner ? getDigit(winner, i, 16) + 8 : 0;
    });
}

const txtURL = "https://mwmccarthy.github.io/rearrange/skills.txt";
const request = new XMLHttpRequest();

request.onload = function() {
    const lines = request.response.split("\n").slice(0, -1);
    const keys = ["skills"];

    for (const line of lines) {
        const depth = (line.match(/\|/g) || []).length + 1;
        const stats = (line.match(/[CDISW]/g) || []).reduce(function(hex, stat) {
            return hex + 16 ** ("WSIDC".indexOf(stat));
        }, 0);

        let obj = dataObj;

        keys[depth] = line.match(/[\w-]+/)[0];
        for (let i = 0; i < depth; i++) {
            obj = obj[keys[i]];
        }
        if (stats) {
            const option = document.createElement("option");
            option.innerHTML = keys.slice(1, depth + 1).join(".");
            datalist.appendChild(option);
            obj[keys[depth]] = { "statDeps": stats };
        }
        else {
            obj[keys[depth]] = {};
        }
    }

    addButton.addEventListener("click", function() {
        if (!Array.from(datalist.childNodes).map(o => o.value).includes(input.value)) {
            input.value = "";
            error.innerText = "Enter a valid skill from the list.";
            return;
        }

        if (Array.from(document.querySelectorAll("li.list_item > span")).map(s => s.innerText).includes(input.value)) {
            input.value = "";
            error.innerText = "Enter a skill which hasn't already been added.";
            return;
        }

        error.innerText = "";

        const li = document.createElement("li");
        const removeButton = document.createElement("i");
        const upButton = document.createElement("i");
        const downButton = document.createElement("i");
        const skill = document.createElement("span");

        li.setAttribute("class", "list_item");
        removeButton.setAttribute("class", "button red");
        upButton.setAttribute("class", "button blue");
        downButton.setAttribute("class", "button blue");

        removeButton.innerText = "\u2297";
        upButton.innerText = "\u2191";
        downButton.innerText = "\u2193";
        skill.innerText = `${input.value}`;
        input.value = "";

        li.appendChild(upButton);
        li.appendChild(downButton);
        li.appendChild(skill);
        li.appendChild(removeButton);

        skillsList.appendChild(li);

        removeButton.addEventListener("click", function() {
            this.parentNode.parentNode.removeChild(this.parentNode);
            updateRearrange();
        });

        upButton.addEventListener("click", function() {
            const prev = this.parentNode.previousSibling;
            if (prev) this.parentNode.parentNode.insertBefore(this.parentNode, prev);
            updateRearrange();
        });

        downButton.addEventListener("click", function() {
            const next = this.parentNode.nextSibling;
            if (next) this.parentNode.parentNode.insertBefore(next, this.parentNode);
            updateRearrange();
        });

        updateRearrange();
    });

    input.addEventListener("keyup", function(e) {
        if (e.keyCode === 13) addButton.click();
    });

    niceBox.addEventListener("change", function() {
        updateRearrange()
    });

    rankedBox.addEventListener("change", function() {
        updateRearrange()
    });
}

request.open("GET", txtURL);
request.responseType = "text";
request.send();


// request.onload = function() {
//     const datalist = document.getElementById("datalist");
//     const skills = request.response;
//     const getSkills = function(obj, string = "") {
//         for (const key in obj) {
//             if (typeof obj[key] == "object") {
//                 getSkills(obj[key], `${string}.${key}`);
//             } else {
//                 let option = document.createElement("option");
//                 option.innerHTML = `${string}.${key}`.slice(1);
//                 datalist.appendChild(option);
//             }
//         }
//     }
//     getSkills(skills);
// }
