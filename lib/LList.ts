
export interface LList<R> {}
export class Cons<R> implements LList<R> {
    public constructor(
        public car: LList<R>,
        public cdr: R){}
}
export class Nil<R> implements LList<R> {}
