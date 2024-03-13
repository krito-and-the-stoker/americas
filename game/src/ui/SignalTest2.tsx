import Signal from 'util/signal-ts'
// @ts-ignore
import style from  './SignalTest.module.scss'
import { createSignal } from 'solid-js'

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
            Signal.log('inside catch'),
            Signal.select(s => s.length),
        ),
        // Signal.assert.not.isError(),
        Signal.await(maybeFail),
        Signal.assert.isError(
            Signal.select(error => `Error: ${error.message}`)
        ),
        Signal.log('after catch'),
        // Signal.select(x => `${x}`)
    )

    Signal.createSolid(
        Signal.emit(Math.random() > 0.5 ? 'hi' : 1),
        Signal.assert.isNumber(
            Signal.stop()
        ),
        Signal.select()
    )

    return <div class={style.main}>
        <h1>Hallo</h1>
        <div>
            String Length: {test()}
        </div>
        <input value={inputValue()} onInput={receiveInput} />
    </div>
}


export default SignalTest