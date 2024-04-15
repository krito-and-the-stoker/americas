import 'chart.js/auto'
import { createResource, Switch, Match } from 'solid-js'
import { Bar, Pie } from 'solid-chartjs'
import Timeline from './Timeline'
import CityBar from './CityBar'

const options = {
  aspectRatio: 1,
}

const Dashboard = () => {
  const [data] = createResource(async () => {
    try {      
      const res = await fetch('/api/events/summary')
      return await res.json()
    } catch(e) {
      console.error(e)
    }
  })


  const numberOfUsers = () => Object.keys(data().countByUserID).length
  const userActivityData = () => {
    const buckets: number[] = []
    Object.values(data().countByUserID).forEach(count => {
      const bucket = Math.floor(Math.log2(count as number))
      if (!buckets[bucket]) {
        buckets[bucket] = 0
      }
      buckets[bucket]++
    })

    return {
      labels: Object.keys(buckets).map(exp => Number(exp) ? `Users with ${Math.pow(2, Number(exp))} - ${Math.pow(2, Number(exp) + 1) - 1} Events` : '1 Event'),
      datasets: [{
        label: 'Number of Users',
        data: Object.values(buckets),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }]
    }
  }

  const eventsAndUserData = () => {
    const events = data().totalCount
    const users = numberOfUsers()
    return {
      labels: [`${events} Events`, `${users} Users`],
      datasets: [{
        label: 'Count',
        data: [events, users],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }]
    }
  }

  const eventTypeData = () => {
    const sortedData = [
      data().countByName.PageView,
      data().countByName.NewGame,
      data().countByName.ResumeGame,
      data().countByName.Autosave,
      data().countByName.Error,
    ]
    const labels = [
      "PageView",
      "NewGame",
      "ResumeGame",
      "AutoSave",
      "Error",
    ]
    const colors = {
      pageview: '#4572F9',
      newgame: '#46FAD9',
      resume: '#24B379',
      autosave: '#FAE26C',
      error: '#AF2626',
    }
    const backgroundColors = [
      colors.pageview,
      colors.newgame,
      colors.resume,
      colors.autosave,
      colors.error,
    ]

    return {
      labels,
      datasets: [{
        data: sortedData,
        backgroundColor: backgroundColors,
        hoverBackgroundColor: backgroundColors
      }]
    }
  }



  return (
    <div class="w-screen mx-auto px-8 max-w-screen-2xl">


      <h1 class="mt-8 text-xl font-bold">Event Dashboard</h1>
      <a class="text-sm underline" href="/errors">View Errors</a>

      <div class="mt-6">
        <Switch>
          <Match when={data.loading}>
            <div>Loading...</div>
          </Match>

          <Match when={data.error}>
            <div>Error loading data</div>
          </Match>

          <Match when={data()}>
            <div class="w-full">
              <div class="grid grid-cols-3 gap-5">
                <div class="col-span-1">
                  <h3>Total Events: {data().totalCount}</h3>
                  <Bar data={eventsAndUserData()} />
                </div>
                <div class="col-span-1">
                  <h3>Total Users: {numberOfUsers()}</h3>
                  <Bar data={userActivityData()} />
                </div>
                <div class="col-span-1">
                  <h3>Event Types</h3>
                  <Pie data={eventTypeData()} options={options} />
                </div>
              </div>
              <div class="col-span-3 my-5">
                <CityBar />
              </div>
              <div class="col-span-3 my-5">
                <Timeline />
              </div>
            </div>
          </Match>
        </Switch>
      </div>
    </div>
  )
}

export default Dashboard
