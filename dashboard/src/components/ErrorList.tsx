import { createResource, For } from 'solid-js'

type RawErrorItem = {
    id: string
    version: string
    message: string
    gameid: string
    timestamp: string
}

type DisplayErrorItem = {
    id: string
    name: string
    version: string
    message: string
    time: string
}

function capitalize(s: string | undefined) {
    return s && (s.charAt(0).toUpperCase() + s.slice(1))
        .replace(/-([a-z])/g, (_, c) => ' ' + c.toUpperCase())
}

async function fetchErrors() {
    const response = await fetch('/api/error/list')
    const data = await response.json()

    return data.errors as RawErrorItem[]
}


function ErrorList() {
    const [errors] = createResource(fetchErrors)

    const sortedErrors = () => errors.loading
        ? []
        : [...errors()!].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
    const displayErrors  = () => sortedErrors()!.map((error) => ({
            id: error.id,
            name: capitalize(error.gameid.split('--')[1]) ?? 'Unnamed',
            version: error.version,
            message: error.message,
            time: new Date(error.timestamp).toLocaleString(),
        })) as DisplayErrorItem[]

    return (
        <>
            <h1>Error List</h1>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Version</th>
                        <th>Message</th>
                        <th>Time</th>
                        <th>Inspect</th>
                    </tr>
                    </thead>
                    <tbody>
                    <For each={displayErrors()}>
                    {(error) => (
                        <tr>
                            <td>{error.name}</td>
                            <td>{error.version}</td>
                            <td>{error.message}</td>
                            <td>{error.time}</td>
                            <td><a href={`/errors/${error.id}`}>Inspect</a></td>
                        </tr>
                    )}
                    </For>
                </tbody>
            </table>
        </>
    )
}

export default ErrorList
