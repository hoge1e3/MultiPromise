import State from "./State";
import MultiPromise from "./MultiPromise";

export default interface Parser<R> {
    parse<S extends State<R>>(state:S):MultiPromise<State<R>>;
}
