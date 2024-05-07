import { Line } from 'solid-chartjs';
import { createResource  } from 'solid-js';

type EventCounts = {
    PageView: number
    NewGame: number
    ResumeGame: number
    AutoSave: number
    Error: number
    Users: number
}

type Timeline = {
    [date: string]: EventCounts
}

const lineOptions = {
    aspectRatio: 5,
    scales: {
        y: {
            type: 'linear',
            display: true,
            position: 'left',
        },
        y1: {
            type: 'linear',
            display: true,
            position: 'right',

            // grid line settings
            grid: {
                drawOnChartArea: false, // only want the grid lines for one axis to show up
            },
        },
    },
}

// const _ = {
//   pageview: 'rgb(37, 150, 190)',
//   newgame: 'rgb(70, 250, 217)',
//   resume: 'rgb(36, 179, 121)',
//   autosave: 'rgb(250, 226, 108)',
//   error: 'rgb(175, 38, 38)',
// }


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
                    label: 'Users',
                    data: Object.values(counts).map(count => count.Users),
                    backgroundColor: 'rgba(94, 21, 96, 0.5)',
                    borderColor: 'rgba(94, 21, 96, 1)',
                    borderWidth: 1,
                },                {
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
                    yAxisID: 'y1',
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

    return <>
        <h3>Timeline</h3>
        <Line data={eventData()} options={lineOptions} />
    </>
}

export default Timeline