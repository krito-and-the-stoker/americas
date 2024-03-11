import Signal from 'util/signal-ts'
// @ts-ignore
import style from  './SignalTest.module.scss'
import { createSignal } from 'solid-js'

// import Util from 'util/util'


function wait<T>(ms: number){
    return (x: T) => new Promise<T>(resolve => { setTimeout(() => resolve(x), Math.random()*ms) })
}

function SignalTest() {
    const obj = {
        a: 5,
        b: {
            test: 'hi',
            more: 'test'
        }
    }


    const aSignal = Signal.createSolid(
        Signal.chain(
            Signal.emit(obj),
            // Signal.key('a')
            Signal.chain(
                // Signal.select(value => value.b),
                Signal.key('b'),
                Signal.key('test')
            )
        )
    )

    const counter = Signal.primitive(0)
    setInterval(() => {
        if (counter.value < 10) {
            counter.update(counter.value + 1)
        }
        obj.a = Math.random()
        obj.b.test += '!'
    }, 100)
    setInterval(() => {
        obj.b = {
            test: 'Neuer Test: ' + Math.floor(100 * Math.random()),
            more: 'no way'
        }
    }, 5000)

    const multiplication = Signal.createSolid(
        Signal.combine(
            counter.listen,
            Signal.chain(
                Signal.emit(obj),
                Signal.key('a')
            ),
            Signal.emit('welt')
        ),
        Signal.effect(([_, __, greeting]) => console.log('hi', greeting)),
        Signal.select(([a, b]) => a * b),
        Signal.collect(
            Signal.gate(values => values.length === 10)
        ),
        Signal.log('collection'),
        Signal.select(values => values.join(', '))
    )

    const moreCounting = Signal.createSolid(
        counter.listen,
        // Signal.log('Pushing to queue'),
        Signal.await(wait(500), 'order'),
        Signal.assert.not.isError()
        // Signal.log('Promise resolved'),
    )
    Signal.createSolid(
        counter.listen,
        // Signal.log('I am early'),
        Signal.select(value => - value),
        // Signal.log('neg'),
    )
    // Signal.createSolid(
    //     counter.listen,
    //     Signal.await(wait(500), 'queue'),
    //     Signal.collect(
    //         Signal.gate(values => values.length >= 3),
    //         Signal.select(values => Util.sum(values))
    //     ),
    //     Signal.effect(counter.update),
    // )

    const anotherCounter = Signal.createSolid(
        counter.listen,
        Signal.select(value => value * 2),
        Signal.select(value => -value),
        Signal.select(value => value * 2),
        Signal.select(value => value),
    )

    const signal = Signal.createSolid(
        counter.listen,
        Signal.select(value => Math.pow(value, 2)),
        Signal.select(value => -value)
    )

    const [input, setInput] = createSignal('')
    const updateInput = (e: Event) => {
        const target = e.target as HTMLInputElement
        setInput(target.value)
    }

    const characters = Signal.createSolid(
        Signal.fromSolid(input).listen,
        Signal.select(value => value.split('')),
        Signal.each(
            Signal.select(value => value + ' '),
            Signal.await(wait(1000), 'discard'),
        ),
        Signal.select(value => value.join('')),
    )

    return <div class={style.main}>
        <h1>Hallo</h1>
        <div>Signal: <span>{signal()}</span> More:<span>{aSignal()}</span></div>
        <div>ChainX: <span>{anotherCounter()}</span></div>
        <div>More Counting: <span>{moreCounting()}</span></div>
        <div><input value={input()} onInput={updateInput} /></div>
        <div>{characters()}</div>
        <div>{multiplication()}</div>
    </div>
}


export default SignalTest