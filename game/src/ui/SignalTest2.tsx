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

    const input = Signal.solid.primitive(inputValue)

    Signal.solid.create(
        Signal.emit(Math.random() > 0.5 ? 1 : undefined),
        // Signal.select(x => x ? x + 1 : null),
        Signal.assert.not.isNothing(
            Signal.select(x => [2*x + 5]),
            // Signal.select(x => x.map(x => x - 1)),
        ),
        Signal.select(x => x ? x.length : '0')
    )

    const isString = (x: any): x is string => typeof x === 'string'
    const test = Signal.solid.create(
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

    Signal.solid.create(
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

    Signal.chain(
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

    function wait<T>(ms: number) {
        return (value: T) => new Promise<T>(resolve => setTimeout(() => resolve(value), ms))
    }

    const disconnect = Signal.connect(
        Signal.listen.event('click'),
        Signal.select(event => event.target),
        Signal.assert.isNothing(
            Signal.log('found nothing'),
            Signal.stop()
        ),
        // Signal.log('new target'),
        Signal.listen.event('mousemove'),
        Signal.await.block(
            Signal.select(wait(20000)),
        ),
        Signal.assert.not.isError(),
        // Signal.assert.isNothing(
        //     Signal.log('we found nothing!'),
        //     Signal.stop()
        // ),
        Signal.select(event => [event.clientX, event.clientY]),
        Signal.select(([x, y]) => `(${x}, ${y})`),
        Signal.window(5),
        Signal.select(x => [x[0], x[4]].join(' -> ')),
        Signal.log('move'),
    )
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
    Signal.chain(
        Signal.solid.listen(inputValue),
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
    Signal.chain(
        // chain,
        Signal.solid.listen(inputValue),
        // Signal.buffer(10),
        // Signal.passIf(x => x.length === 10),
        // Signal.sidechain(Signal.count()),
        // Signal.passIf(([_, index]) => index % 2 === 0),
        // Signal.select(([char]) => char),
        // Signal.await.through(
        //     Signal.select(resolveOnButton)
        // ),
        // Signal.count(),
        Signal.log('chain 1')
    )

    // Signal.connect(
    //     chain,
    //     Signal.log('chain 2')
    // )
    let emitter = Signal.primitive.create(0)
    setInterval(() => emitter.update(Math.random()), 1000)

    Signal.connect(
        emitter.listen,
        Signal.log('emitter'),
        Signal.passIf(x => x > 0.5),
        Signal.chain(
            Signal.count(),
            // Signal.select(x => -x),
        ),
        Signal.log('count'),
    )

    function passIfChanged<V>() {
        return Signal.chain(
            Signal.select<V>(),
            Signal.sidechain(
                Signal.collect((lastValue, value) => ([value, lastValue[0]]), [] as V[]),
                Signal.log('last, current'),
                Signal.passIf(([lastValue, value]) => lastValue !== value),
            ),
            Signal.select(([x]) => x)
        )
    }

    Signal.chain(
        Signal.merge(
            Signal.chain(
                Signal.listen.event('keypress'),
                Signal.select(event => event.key),
                Signal.collect((keys, key) => key === ' ' ? key : keys + key, ''),
            ),
            // emitter.listen,
        ),
        Signal.select(word => `'${word}'`),
        Signal.log('Duplicate Word'),
        passIfChanged(),
        Signal.log('Unique Word')
    )

    Signal.chain(
        emitter.listen,
        Signal.select(() => Math.random()),
        Signal.passIf(x => x > 0.5),
        Signal.select(x => x.toFixed(2)),
        Signal.effect(x => {
            console.log('do', x)
            return () => {
                console.log('undo', x)
            }
        })
    )

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