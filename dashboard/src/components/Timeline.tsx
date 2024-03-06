import { Line } from 'solid-chartjs';
import { createResource  } from 'solid-js';

type EventCounts = {
    PageView: number
    NewGame: number
    ResumeGame: number
    AutoSave: number
    Error: number
}

type Timeline = {
    [date: string]: EventCounts
}

const lineOptions = {
  aspectRatio: 5,
}



function Timeline() {
    const [data] = createResource(async () => {
        try {
            const res = await fetch('/api/events/timeline')
            return await res.json() as {
                countByDay: Timeline
            }
        } catch(e) {
            console.error(e)
        }
    })

    const eventData = () => {
        const counts = data()?.countByDay
        if (!counts) {
            return null
        }

        return {
            labels: Object.keys(counts),
            datasets: [
                {
                    label: 'Page Views',
                    data: Object.values(counts).map(count => count.PageView),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'New Games',
                    data: Object.values(counts).map(count => count.NewGame),
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Resume Games',
                    data: Object.values(counts).map(count => count.ResumeGame),
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Auto Saves',
                    data: Object.values(counts).map(count => count.AutoSave),
                    backgroundColor: 'rgba(153, 102, 255, 0.5)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Errors',
                    data: Object.values(counts).map(count => count.Error),
                    backgroundColor: 'rgba(255, 206, 86, 0.5)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1,
                }
            ]
        }
    }

    return <div class="row">
        <div class="chart-full">
            <h3>Timeline</h3>
            <Line data={eventData()} options={lineOptions} />
        </div>
    </div>
}

export default Timeline