"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MultiPromise_1 = require("./lib/MultiPromise");
const R = MultiPromise_1.default.resolve;
const dict = { "か": "蚊", "が": "蛾", "がか": "画家", "かが": "加賀" };
class Noun {
    constructor(c) {
        this.c = c;
    }
    toString() {
        return dict[this.c];
    }
    isRedundant() { return false; }
}
class Or {
    constructor(left, right) {
        this.left = left;
        this.right = right;
    }
    toString() {
        return `${this.left}か${this.right}`;
    }
    flatten() {
        const f = (n) => n instanceof Or ? n.flatten() : [n];
        return f(this.left).concat(f(this.right));
    }
    isRedundant() {
        if (this.left.isRedundant() || this.right.isRedundant())
            return true;
        const m = new Set();
        for (const n of this.flatten()) {
            if (m.has(`${n}`))
                return true;
            m.add(`${n}`);
        }
        return false;
    }
}
class Ka {
    constructor(body) {
        this.body = body;
    }
    toString() {
        return `${this.body}か`;
    }
    isRedundant() { return this.body.isRedundant(); }
}
class Isa {
    constructor(left, right) {
        this.left = left;
        this.right = right;
    }
    toString() {
        return `「${this.left}が${this.right}」`;
    }
    isInclusive() {
        const f = (n) => n instanceof Or ? n.flatten() : [n];
        const ls = new Set();
        const rs = new Set();
        for (const l of f(this.left))
            ls.add(`${l}`);
        for (const r of f(this.right))
            rs.add(`${r}`);
        for (const l of ls.values()) {
            if (rs.has(l))
                return true;
        }
        for (const r of rs.values()) {
            if (ls.has(r))
                return true;
        }
        return false;
    }
    isRedundant() {
        return `${this.left}` === `${this.right}` || this.isInclusive() || this.left.isRedundant() || this.right.isRedundant();
    }
}
class StateImpl {
    constructor(result, input, pos) {
        this.result = result;
        this.input = input;
        this.pos = pos;
    }
    get id() {
        return "" + this.pos;
    }
    get eof() {
        return this.pos >= this.input.length;
    }
    advance(by, result = this.result) {
        return new StateImpl(result, this.input, this.pos + by);
    }
    withResult(result) {
        return new StateImpl(result, this.input, this.pos);
    }
    head(c = 1) {
        return this.input.substring(this.pos, this.pos + c);
    }
    lookingAt(str) {
        if (typeof str === "string") {
            if (this.head(str.length) === str)
                return str;
        }
        else {
            const r = str.exec(this.input.substring(this.pos));
            if (r)
                return r[0];
        }
    }
    advanceIfLooking(str) {
        const s = this.lookingAt(str);
        if (s) {
            return this.advance(s.length);
        }
    }
}
function parseNoun(s) {
    return new MultiPromise_1.default((succ, e) => {
        for (const n of ["か", "が", "がか" /*,"かが"*/]) {
            const r = s.lookingAt(n);
            if (r) {
                succ(s.advance(r.length, new Noun(r)));
            }
        }
        e();
    });
}
function parseOrNoun(s) {
    return parseNoun(s).then(s => {
        const a = R(s);
        const r = s.advanceIfLooking("か");
        if (!r)
            return a;
        return parseOrNoun(r).map((s2) => s2.withResult(new Or(s.result, s2.result))).append(a);
    });
}
function parseIsa(s) {
    return parseOrNoun(s).then((s) => {
        const r = s.advanceIfLooking("が");
        if (!r)
            return;
        return parseOrNoun(r).map((s2) => s2.withResult(new Isa(s.result, s2.result)));
    });
}
function parseIsaOr(s) {
    return parseIsa(s).then((s) => {
        const r = s.advanceIfLooking("か");
        if (!r)
            return R(s);
        return parseIsaOr(r).map((s2) => s2.withResult(new Or(s.result, s2.result))).concat(R(s));
    });
}
function parseIsaOrKa(s) {
    return parseIsaOr(s).then((s) => {
        const r = s.advanceIfLooking("か");
        if (!r)
            return R(s);
        return R(r.withResult(new Ka(s.result))).concat(R(s));
    });
}
function* genSeq() {
    yield "か";
    yield "が";
    for (const g of genSeq()) {
        yield `${g}か`;
        yield `${g}が`;
    }
}
let count = 0;
const seq = genSeq();
function removeSub(s, list) {
    let res = s;
    for (const sub of list) {
        const i = s.indexOf(sub);
        if (i < 0)
            continue;
        res = res.substring(0, i) + ("＊".repeat(sub.length)) + res.substring(i + sub.length);
        if (count == 13) {
            console.log(s, "matches", sub, res);
        }
    }
    return res;
}
function allSame(items) {
    if (items.length <= 1)
        return true;
    items = items.slice();
    const k = items.shift();
    while (items.length > 0) {
        if (k !== items.shift())
            return false;
    }
    return true;
}
function alreadyAppeared(items, appeared) {
    const r = items.map(item => removeSub(item, appeared));
    if (allSame(r))
        return true;
    console.log(r.map(s => `[${s}]`).join("\n"));
    return false;
}
function allKa(items) {
    for (const n of items) {
        if (!(n instanceof Ka))
            return false;
    }
    return true;
}
function commonSeq(items) {
    if (allKa(items))
        return true;
    const f = (n) => n instanceof Or ? n.flatten() : [n];
    let hasKa = false;
    const flattens = items.map(n => {
        if (n instanceof Ka) {
            hasKa = true;
            return n.body;
        }
        return n;
    }).map(f);
    if (allSame(flattens.map(f => `${f[0]}`)))
        return true;
    if (!hasKa && allSame(flattens.map(f => `${f[f.length - 1]}`)))
        return true;
    if (items.length >= 3 && allSame(flattens.map(i => i.length))) {
        for (let i = 1; i < items.length - 1; i++) {
            if (allSame(flattens.map(f => `${f[i]}`)))
                return true;
        }
    }
    return false;
}
const appeared = [];
function gen() {
    if (count > 100)
        return;
    const str = seq.next().value;
    const initResult = new Noun("");
    const initState = new StateImpl(initResult, str, 0);
    parseIsaOrKa(initState).then((r) => {
        if (r.eof)
            return R(r);
    }).all((rs) => {
        rs = rs.filter(r => !r.result.isRedundant());
        if (rs.length >= 2) {
            //if (!alreadyAppeared(rs.map(r=>`${r.result}`), appeared)) {
            //if (!commonSeq(rs.map(r=>r.result))) {
            count++;
            console.log(`[${count}]`, str);
            for (const r of rs) {
                console.log(`${r.result}`);
                appeared.unshift(`${r.result}`);
            }
            console.log("");
        }
        setTimeout(gen, 0);
    });
}
gen();
//const t=new Isa(new Noun("が"),new Noun("が"));
//console.log(t,`${t}`,t.isRedundant());
