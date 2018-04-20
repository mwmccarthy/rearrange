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

function getSkills(obj, acc = []) {
    for (const k in obj) {
        if (typeof obj[k] === 'object') {
            acc.push[k];
            getSkills(obj[k], acc);
        } else {
            acc.push(k);
            console.log(acc.join(".") + obj[k]);
        }

    }
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
const rearranges = nDigitsSumToS(5, 25, 16);

let best = 0;
let winner;
for (const re of rearranges) {
    const m = statMultiplicator(0x02012, re);
    if (m > best) {
        winner = re;
        best = m;
    }
}

console.log(winner.toString(16));
console.log(best);

const requestURL = 'https://mwmccarthy.github.io/rearrange/skills.json';
const request = new XMLHttpRequest();
request.open('GET', requestURL);
request.responseType = 'json';
request.send();
request.onload = function() {
    const skills = request.response;
    const datalist = document.getElementById("datalist");
    getSkills(skills);
}
