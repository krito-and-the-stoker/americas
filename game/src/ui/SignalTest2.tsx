import Signal from 'util/signal-ts'
// @ts-ignore
import style from  './SignalTest.module.scss'
import { createSignal } from 'solid-js'
import Util from 'util/util'

// import Util from 'util/util'
async function maybeFail<T>(x: T): Promise<T> {
    await new Promise(resolve => setTimeout(resolve, 100))
    if (Math.random() < 0.25) {
        throw new Error('Random error')
    }

    return x
}

function SignalTest() {
    const [inputValue, setInputValue] = createSignal('')
    const receiveInput = (e: Event) => {
        const target = e.target as HTMLInputElement
        setInputValue(target.value)
    }

    const input = Signal.fromSolid(inputValue)

    Signal.createSolid(
        Signal.emit(Math.random() > 0.5 ? 1 : undefined),
        // Signal.select(x => x ? x + 1 : null),
        Signal.assert.not.isNothing(
            Signal.select(x => [2*x + 5]),
            // Signal.select(x => x.map(x => x - 1)),
        ),
        Signal.select(x => x ? x.length : '0')
    )

    const isString = (x: any): x is string => typeof x === 'string'
    const test = Signal.createSolid(
        input.listen,
        Signal.select(x => x ? `${x}` : undefined),
        Signal.assert.isNothing(
            Signal.select(x => x),
            Signal.select(() => null)
        ),
        // Signal.assert.isNothing(
        //     Signal.select(() => '0')
        // ),
        Signal.catch(
            Signal.select(x => x!.split('').join('')),
            Signal.select(x => Math.random() > 0.75 ? x : x.length),
            Signal.assert.create(isString, 'Value must be a string')(),
            // Signal.log('inside catch'),
            Signal.select(s => s.length),
        ),
        // Signal.assert.not.isError(),
        Signal.await.latest(Signal.select(maybeFail)),
        Signal.assert.isError(
            Signal.select(error => `Error: ${error.message}`)
        ),
        // Signal.log('after catch'),
        // Signal.select(x => `${x}`)
    )

    Signal.createSolid(
        Signal.emit(Math.random() > 0.5 ? 'hi' : 1),
        Signal.assert.isNumber(
            Signal.stop()
        ),
        Signal.select()
    )

    const data = {
        a: [1, 2, 3],
        b: {
            hello: 'world',
            array: ['I', 'am', 'an', 'array']
        }
    }
    // @ts-expect-error
    window.data = data

    Signal.connect(
        Signal.emit(data),
        Signal.combine(
            Signal.chain(
                Signal.listen.key('a'),
                Signal.log('a'),
                Signal.each(
                    Signal.log('a.each')
                )
            ),
            Signal.chain(
                Signal.listen.key('b'),
                Signal.log('b'),
                Signal.combine(
                    Signal.chain(
                        Signal.listen.key('array'),
                        Signal.log('b.array'),
                    ),
                    Signal.chain(
                        Signal.listen.key('hello'),
                        Signal.log('b.hello')
                    )
                )
            )
        ),
    )

    // const disconnect = Signal.connect(
    //     Signal.listen.event('click'),
    //     Signal.select(event => event.target),
    //     Signal.assert.isNothing(
    //         Signal.log('found nothing'),
    //         Signal.stop()
    //     ),
    //     Signal.log('new target'),
    //     Signal.listen.event('mousemove'),
    //     // Signal.assert.isNothing(
    //     //     Signal.log('we found nothing!'),
    //     //     Signal.stop()
    //     // ),
    //     Signal.select(event => [event.clientX, event.clientY]),
    //     Signal.log('move')
    // )
    let resolves: Function[] = []
    const resolveNext = () => {
        const resolve = Util.choose(resolves)
        resolves = resolves.filter(r => r !== resolve)
        if (resolve) {
            resolve()
        }
    }
    const resolveOnButton = (x: string) => new Promise<string>(resolve => { resolves.push(() => resolve(x)) })
    // const wait = (ms: number, value: string) => new Promise<string>(resolve => setTimeout(() => resolve(value), ms))
    const chain = Signal.chain(
        Signal.fromSolid(inputValue).listen,
        // Signal.emit('hi'),
        // Signal.log('url'),
        Signal.select(x => x || undefined),
        Signal.assert.isNothing(Signal.stop()),
        Signal.log('before queue'),
        // Signal.count(),
       Signal.await.queue(
            Signal.select(input => input && `Input: ${input}`),
            // Signal.select(x => `count: ${x}`),
            Signal.log('input'),
            Signal.assert.isNothing(
                Signal.stop()
            ),
            Signal.select(resolveOnButton),
            // Signal.select(url => fetch(url)),
            // Signal.select(response => response.json())
        ),
        Signal.log('result')
    )
    const disconnect = Signal.connect(
        chain,
        // Signal.fromSolid(inputValue).listen,
        // Signal.await.through(
        //     Signal.select(resolveOnButton)
        // ),
        Signal.count(),
        Signal.log('chain 1')
    )
    // Signal.connect(
    //     chain,
    //     Signal.log('chain 2')
    // )

    // @ts-ignore
    window.disconnect = disconnect

    return <div class={style.main}>
        <h1>Hallo</h1>
        <div>
            String Length: {test()}
        </div>
        <input value={inputValue()} onInput={receiveInput} />
        <button onClick={resolveNext}>resolve!</button>
    </div>
}


export default SignalTest