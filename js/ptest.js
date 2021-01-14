define(["require", "exports", "./lib/MultiPromise"], function (require, exports, MultiPromise_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Element {
        constructor(c) {
            this.c = c;
        }
    }
    class Minus {
        constructor(left, right) {
            this.left = left;
            this.right = right;
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
        advance(by, result = this.result) {
            return new StateImpl(result, this.input, this.pos + by);
        }
        head(c = 1) {
            return this.input.substring(this.pos, this.pos + c);
        }
    }
    function parseElem(s) {
        const c = s.head();
        if (c.match(/\d/))
            return MultiPromise_1.default.resolve(s.advance(1, new Element(c)));
        return MultiPromise_1.default.resolve();
    }
    function parseExpr(s) {
        const res = new MultiPromise_1.default((succ, e) => {
            setTimeout(() => {
                const p = parseElem(s);
                p.onResolve(succ);
                res.then((r) => {
                    if (r.head() === "-") {
                        const n = r.advance(1);
                        if (n.head().match(/\d/)) {
                            succ(n.advance(1, new Minus(r.result, new Element(n.head()))));
                        }
                    }
                    return MultiPromise_1.default.resolve();
                }, e);
            }, 0);
        });
        return res;
    }
    const initResult = new Element("");
    const initState = new StateImpl(initResult, "9-8-7", 0);
    parseExpr(initState).then(s => {
        console.log(s);
        return MultiPromise_1.default.resolve();
    });
});
