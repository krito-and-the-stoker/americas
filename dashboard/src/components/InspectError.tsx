import { createSignal, Show } from 'solid-js'

const host = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://www.play-americas.com'

async function fetchGameData(id: string) {
    const response = await fetch('/api/error/get/' + id)
    const data = await response.json()

    return data.error?.savegame
}

async function fetchGameId(id: string) {
    const response = await fetch('/api/error/get/' + id)
    const data = await response.json()

    return data.error?.gameid
}

async function createGame(data: string) {
    const result = await fetch('/api/game/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: 'super-user', data })
    })

    return await result.json()

}

async function openGameServer(id: string) {
    setIsOpening(true)
    const data = await fetchGameData(id)
    const response = await createGame(data)

    setIsOpening(false)
    if (response?.redirect) {
        window.open(host + response.redirect, '_blank')
    }
}

async function openGameLocal(id: string) {
    setIsOpening(true)
    const gameId = await fetchGameId(id)

    setIsOpening(false)

    if (gameId) {
        window.open(`http://localhost:3000/game/${gameId}`)
    }
}

async function removeError(id: string) {
    setIsOpening(true)
    await fetch(`/api/error/delete/${id}`)
    window.location.href = "/errors"
    setIsOpening(false)
}

const [isOpening, setIsOpening] = createSignal(false)

function InspectError(props: any) {
    return <div class="mt-24 mx-auto max-w-4xl text-center">
        <h1>Error ID: {props.params.id}</h1>
        <div>
            <button
                class="bg-blue-500 text-white font-bold py-2 px-4 rounded my-12 mx-2"
                classList={{'opacity-50': isOpening(), 'cursor-not-allowed': isOpening(), 'hover:bg-blue-700': !isOpening()}}
                onClick={() => !isOpening() && openGameServer(props.params.id)}
                disabled={isOpening()}>
                Open Game on Server
            </button>
            <button
                class="bg-blue-500 text-white font-bold py-2 px-4 rounded my-12 mx-2"
                classList={{'opacity-50': isOpening(), 'cursor-not-allowed': isOpening(), 'hover:bg-blue-700': !isOpening()}}
                onClick={() => !isOpening() && openGameLocal(props.params.id)}
                disabled={isOpening()}>
                Open Game on localhost:3000
            </button>
            <button
                class="bg-red-500 text-white font-bold py-2 px-4 rounded my-12 mx-2"
                classList={{'opacity-50': isOpening(), 'cursor-not-allowed': isOpening(), 'hover:bg-red-700': !isOpening()}}
                onClick={() => !isOpening() && removeError(props.params.id)}
                disabled={isOpening()}>
                Delete Error
            </button>
            <Show when={isOpening()}><div>Loading game...</div></Show>
        </div>
        <div>
            <a class="underline" href="/errors">Back to Error List</a>
        </div>
    </div>
}

export default InspectError