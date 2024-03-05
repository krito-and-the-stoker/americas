const host = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://www.play-americas.com'

async function fetchGameData(id: string) {

    const response = await fetch('/api/error/get/' + id)
    const data = await response.json()

    console.log(data)

    return data.error?.savegame
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

async function openGame(id: string) {
    const data = await fetchGameData(id)
    const response = await createGame(data)

    if (response?.redirect) {
        window.open(host + response.redirect, '_blank')
    }
}


function InspectError(props: any) {
    return <div class="container">
        <h1>Error ID: {props.params.id}</h1>
        <div><button onClick={() => openGame(props.params.id)}>Open Game</button></div>
        <div class="m-top">
            <a href="/errors">Back to Error List</a>
        </div>
    </div>
}

export default InspectError