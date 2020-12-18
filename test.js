"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MultiPromise_1 = require("./lib/MultiPromise");
const m = MultiPromise_1.default.resolve(2, 3, 10);
m.then((r) => MultiPromise_1.default.resolve(...[4, 5].map(e => r * e))).then((r) => {
    console.log("R", r);
    if (r < 100) {
        return m.then((r) => MultiPromise_1.default.resolve(100 * r));
    }
    else {
        return MultiPromise_1.default.resolve();
    }
}, () => {
    console.log("END2");
});
/*
async function test() {
    const r=await MultiPromise.resolve(2,3,10);
    console.log("Q",r);
}

test();
*/
