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

    const sortedData = () => {
        const counts = data()?.countByCity
        if (!counts) {
            return null
        }

        return Object.keys(counts).sort((a, b) => {
            return Object.values(counts[b]).reduce((acc, cur) => acc + cur, 0) - Object.values(counts[a]).reduce((acc, cur) => acc + cur, 0)
        }).map(key => {
            return {
                city: key,
                count: counts[key]
            }
        }).slice(0, 20)
    }


    const eventData = () => {
        const baseData = sortedData()
        if (!baseData) {
            return
        }
        const cities = baseData.map(entry => entry.city)

        return {
            labels: cities,
            datasets: [
                {
                    label: 'Page Views',
                    data: baseData.map(entry => entry.count).map(count => count.PageView),
                    backgroundColor: 'rgba(37, 150, 190, 0.5)',
                    borderColor: 'rgba(37, 150, 190, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'New Games',
                    data: baseData.map(entry => entry.count).map(count => count.NewGame),
                    backgroundColor: 'rgba(70, 250, 217, 0.5)',
                    borderColor: 'rgba(70, 250, 217, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Resume Games',
                    data: baseData.map(entry => entry.count).map(count => count.ResumeGame),
                    backgroundColor: 'rgba(36, 179, 121, 0.5)',
                    borderColor: 'rgba(36, 179, 121, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Auto Saves',
                    data: baseData.map(entry => entry.count).map(count => count.AutoSave),
                    backgroundColor: 'rgba(250, 226, 108, 0.5)',
                    borderColor: 'rgba(250, 226, 108, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Errors',
                    data: baseData.map(entry => entry.count).map(count => count.Error),
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