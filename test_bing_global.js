
const word = "玲娜贝儿";
const url = `https://tse2.mm.bing.net/th?q=${encodeURIComponent(word + ' photo')}&w=512&h=512&c=7&rs=1&p=0`;

console.log(`Testing URL: ${url}`);

async function test() {
    try {
        const res = await fetch(url);
        console.log(`Status: ${res.status}`);
        console.log(`Content-Type: ${res.headers.get('content-type')}`);
    } catch (e) {
        console.error(e);
    }
}

test();
