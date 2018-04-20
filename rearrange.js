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
function statMultiplicator(sk, re) {
    const product = Array.from({length: 5}, function(_, i) {
        return (getDigit(re, i, 16) + 8)**getDigit(sk, i, 16);
    }).reduce((n, acc) => acc * n);
    return 1/9.8 * Math.log(product) - 0.25;
}

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
  console.log(skills);
}
