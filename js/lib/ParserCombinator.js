/*
function and<R>(a: Parser<LList<R>>, b: Parser<R>): Parser<LList<R>> {
    return {
        parse: <S extends State<R>>(state:S):ParserPromise<LList<R>>=>{
            return new ParserPromise<LList<R>>((add,end)=>{
                let acount=0, ecount=0;
                a.parse(state).then(nstate=>{
                    const car=nstate.result;
                    b.parse(nstate).then(nnstate=>{
                        const cdr=nnstate.result;
                        add(nnstate.withResult(new Cons<R>(car, cdr)));
                    }, ()=>{
                        ecount++;
                        if (acount===ecount) end();
                    });
                }, ()=>{
                    acount++;
                    if (acount===ecount) end();
                });
            });
        }
    }
}
*/
