import { Bar } from 'solid-chartjs';
import { createResource  } from 'solid-js';

type EventCounts = {
    PageView: number
    NewGame: number
    ResumeGame: number
    AutoSave: number
    Error: number
}

type Cities = {
    [date: string]: EventCounts
}

const lineOptions = {
  aspectRatio: 5,
}



function CityBar() {
    const [data] = createResource(async () => {
        try {
            const res = await fetch('/api/events/cities')
            return await res.json() as {
                countByCity: Cities
            }
        } catch(e) {
            console.error(e)
        }
    })

    const eventData = () => {
        const counts = data()?.countByCity
        if (!counts) {
            return null
        }

        return {
            labels: Object.keys(counts),
            datasets: [
                {
                    label: 'Page Views',
                    data: Object.values(counts).map(count => count.PageView),
                    backgroundColor: 'rgba(37, 150, 190, 0.5)',
                    borderColor: 'rgba(37, 150, 190, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'New Games',
                    data: Object.values(counts).map(count => count.NewGame),
                    backgroundColor: 'rgba(70, 250, 217, 0.5)',
                    borderColor: 'rgba(70, 250, 217, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Resume Games',
                    data: Object.values(counts).map(count => count.ResumeGame),
                    backgroundColor: 'rgba(36, 179, 121, 0.5)',
                    borderColor: 'rgba(36, 179, 121, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Auto Saves',
                    data: Object.values(counts).map(count => count.AutoSave),
                    backgroundColor: 'rgba(250, 226, 108, 0.5)',
                    borderColor: 'rgba(250, 226, 108, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Errors',
                    data: Object.values(counts).map(count => count.Error),
                    backgroundColor: 'rgba(175, 38, 38, 0.5)',
                    borderColor: 'rgba(175, 38, 38, 1)',
                    borderWidth: 1,
                }
            ]
        }
    }


    return <div class="row">
        <div class="chart-full">
            <h3>Locations</h3>
            <Bar data={eventData()} options={lineOptions} />
        </div>
    </div>
}

export default CityBar