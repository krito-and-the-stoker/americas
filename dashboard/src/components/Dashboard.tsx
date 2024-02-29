import 'chart.js/auto';
import { createResource, Switch, Match } from 'solid-js';
import { Bar, Pie, Line } from 'solid-chartjs';

const options = {
  aspectRatio: 1,
};

const lineOptions = {
  aspectRatio: 5,
};

const Dashboard = () => {
  const [data] = createResource(async () => {
    try {      
      const res = await fetch('/api/events/summary');
      return await res.json();
    } catch(e) {
      console.error(e);
    }
  });


  const numberOfUsers = () => Object.keys(data().countByUserID).length;
  const userActivityData = () => {
    const buckets: number[] = [];
    Object.values(data().countByUserID).forEach(count => {
      const bucket = Math.floor(Math.log2(count as number));
      if (!buckets[bucket]) {
        buckets[bucket] = 0;
      }
      buckets[bucket]++;
    });

    return {
      labels: Object.keys(buckets).map(exp => Number(exp) ? `Users with ${Math.pow(2, Number(exp))} - ${Math.pow(2, Number(exp) + 1) - 1} Events` : '1 Event'),
      datasets: [{
        label: 'Number of Users',
        data: Object.values(buckets),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }]
    };
  };

  const eventsAndUserData = () => {
    const events = data().totalCount;
    const users = numberOfUsers();
    return {
      labels: [`${events} Events`, `${users} Users`],
      datasets: [{
        label: 'Count',
        data: [events, users],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }]
    };
  };

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
    };
  };

  const cityData = () => {
    const dataByCity = data().countByCity as { [key: string]: number }
    const baseData = [...Object.entries(dataByCity)
      .filter(([key, _]) => !!key)
      .sort(([_, a], [__, b]) => b - a)]

    const labels = baseData.map(([key]) => key)
    const dd = baseData.map(([_, value]) => value)

    return {
      labels,
      datasets: [{
        data: dd,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }]
    };
  };

  const eventsPerDay = () => {
    return {
      labels: Object.keys(data().countByDay),
      datasets: [
        {
          label: 'Events per Day',
          data: Object.values(data().countByDay),
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }
      ]
    };
  };

  return (
    <div>
      <style scoped>{`
        .title {
          width: 95vw;
          margin: 50px auto;
        }
        .container {
          width: 95vw;
          margin: 0 auto;
        }
        .row {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
        }
        .chart3rd {
          width: calc(33% - 5vw);
          margin-bottom: 5vw;
        }
        .chart-full {
          width: calc(100% - 5vw);
          margin-bottom: 5vw;
        }
      `}</style>

      <h1 class="title">Event Dashboard</h1>
      <Switch>
        <Match when={data.loading}>
          <div>Loading...</div>
        </Match>

        <Match when={data.error}>
          <div>Error loading data</div>
        </Match>

        <Match when={data()}>
          <div class="container">
            <div class="row">
              <div class="chart3rd">
                <h3>Total Events: {data().totalCount}</h3>
                <Bar data={eventsAndUserData()} />
              </div>
              <div class="chart3rd">
                <h3>Total Users: {numberOfUsers()}</h3>
                <Bar data={userActivityData()} />
              </div>
              <div class="chart3rd">
                <h3>Event Types</h3>
                <Pie data={eventTypeData()} options={options} />
              </div>
            </div>
            <div class="row">
              <div class="chart-full">
                <h3>Cities</h3>
                <Bar data={cityData()} options={lineOptions} />
              </div>
            </div>
            <div class="row">
              <div class="chart-full">
                <h3>Timeline</h3>
                <Line data={eventsPerDay()} options={lineOptions} />
              </div>
            </div>
          </div>
        </Match>
      </Switch>
    </div>
  );
};

export default Dashboard;
