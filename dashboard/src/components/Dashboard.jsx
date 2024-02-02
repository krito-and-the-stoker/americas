import { createResource, createEffect, Switch, Match, For } from 'solid-js';
import { Bar, Pie, Line } from 'solid-chartjs';

const options = {
  aspectRatio: 1,
  plugins: {
    tooltip: {
      callbacks: {
        label: function(context) {
          console.log('hi',context)
          let label = context.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed !== null) {
            label += context.parsed;
          }
          return label;
        }
      }
    }
  }
};

const lineOptions = {
  aspectRatio: 5
}

const Dashboard = (props) => {
  const [data] = createResource(async () => {
    try {      
      const res = await fetch('/api/summary');
      return await res.json();
    } catch(e) {
      console.error(e);
    }
  });

  const userActivityData = () => {
    const buckets = [];
    Object.values(data().countByUserID).forEach(count => {
      const bucket = Math.floor(Math.log2(count));
      if (!buckets[bucket]) {
        buckets[bucket] = 0;
      }
      buckets[bucket]++;
    });

    return {
      labels: Object.keys(buckets).map(exp => exp ? `Users with ${Math.pow(2, exp)} - ${Math.pow(2, Number(exp) + 1) - 1} Events` : '1 Event'),
      datasets: [{
        label: 'User Activity',
        data: Object.values(buckets),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }]
    };
  };

  const eventsAndUserData = () => {
    const events = data().totalCount;
    const users = Object.keys(data().countByUserID).length;
    return {
      labels: [`${events} Events`, `${users} Users`],
      datasets: [{
        label: 'Events and Users',
        data: [events, users],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }]
    };
  };

  const eventTypeData = () => {
    const labels = Object.keys(data().countByName);
    const backgroundColors = labels.map(() => `#${Math.floor(Math.random()*16777215).toString(16)}`); // Random colors

    return {
      labels,
      datasets: [{
        data: Object.values(data().countByName),
        backgroundColor: backgroundColors,
        hoverBackgroundColor: backgroundColors
      }]
    };
  };

  const eventsPerDay = () => {
    return {
      labels: Object.keys(data().countByDay),
      datasets: [
        {
          label: 'Events by Day',
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
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
        }
        .chart {
          width: calc(33% - 5vw);
          margin-bottom: 5vw;
        }
        .line-chart {
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
            <div class="chart">
              <h3>Total Event Count: {data().totalCount}</h3>
              <Bar data={eventsAndUserData()} />
            </div>
            <div class="chart">
              <h3>User Activity</h3>
              <Bar data={userActivityData()} />
            </div>
            <div class="chart">
              <h3>Events Types</h3>
              <Pie data={eventTypeData()} options={options} />
            </div>
            <div class="line-chart">
              <h3>Events per Day</h3>
              <Line data={eventsPerDay()} options={lineOptions} />
            </div>
          </div>
        </Match>
      </Switch>
    </div>
  );
};

export default Dashboard;
