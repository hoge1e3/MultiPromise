define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Cons {
        constructor(car, cdr) {
            this.car = car;
            this.cdr = cdr;
        }
    }
    exports.Cons = Cons;
    class Nil {
    }
    exports.Nil = Nil;
});
