import Signal from 'util/signal-ts'
// @ts-ignore
import style from  './SignalTest.module.scss'


function SignalTest() {
    const obj = {
        a: 5,
        b: {
            test: 'hi',
            more: 'test'
        }
    }
    const listen1 = Signal.objectListener(obj, 'a')
    obj.a = 7
    listen1(value => console.log('listen1', value))

    const aSignal = Signal.createSolid(
        Signal.chain(
            Signal.emit(obj),
            Signal.log('Emitted object'),
            // Signal.key('a')
            Signal.chain(
                // Signal.select(value => value.b),
                Signal.key('b'),
                Signal.log('b is:'),
                Signal.key('test')
            )
        )
    )

    const counter = Signal.primitive(0)
    setInterval(() => {
        counter.update(counter.value + 1)
        obj.a = Math.random()
        obj.b.test += '!'
    }, 1000)
    setInterval(() => {
        obj.b = {
            test: 'Neuer Test: ' + Math.floor(100 * Math.random()),
            more: 'no way'
        }
    }, 5000)

    const anotherCounter = Signal.createSolid(
        counter.listen,
        Signal.select(value => value * 2),
        Signal.select(value => -value),
        Signal.select(value => value * 2),
        Signal.select(value => value)
    )

    const signal = Signal.createSolid(
        counter.listen,
        Signal.select(value => Math.pow(value, 2)),
        Signal.select(value => -value)
    )

    return <div class={style.main}>
        <h1>Hallo</h1>
        <div>Signal: <span>{signal()}</span> More:<span>{aSignal()}</span></div>
        <div>ChainX: <span>{anotherCounter()}</span></div>
    </div>
}


export default SignalTest