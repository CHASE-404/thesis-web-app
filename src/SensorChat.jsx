import { useEffect, useState, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function SensorChart({ historicalData }) {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [dataType, setDataType] = useState('air_temp');
  const [timeRange, setTimeRange] = useState('24'); // Default: 24 hours
  const chartRef = useRef(null);

  // Function to format timestamps for hourly views
  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    // Calculate days since start date
    const startDate = new Date(1743919923 * 1000); // Your start timestamp
    const diffTime = Math.abs(date - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return `DAY ${diffDays}, ${date.toLocaleDateString()}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Function to format date for daily view
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    // Calculate days since start date
    const startDate = new Date(1743919923 * 1000); // Your start timestamp
    const diffTime = Math.abs(date - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return `DAY ${diffDays}, ${date.toLocaleDateString()}`;
  };

  // Function to format week range
  const formatWeekRange = (weekStart, weekEnd) => {
    // Calculate week number based on start date
    const startDate = new Date(1743919923 * 1000); // Your start timestamp
    const diffTime = Math.abs(weekStart - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffDays / 7) + 1;
    
    return `WEEK ${weekNumber} (${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()})`;
  };

  // Chart configuration
  const chartConfig = {
    air_temp: { label: 'Air Temperature (°C)', color: 'rgba(255, 99, 132, 0.7)' },
    humidity: { label: 'Humidity (%)', color: 'rgba(54, 162, 235, 0.7)' },
    water_temp: { label: 'Water Temperature (°C)', color: 'rgba(255, 206, 86, 0.7)' },
    ph: { label: 'pH Level', color: 'rgba(75, 192, 192, 0.7)' },
    tds: { label: 'TDS (ppm)', color: 'rgba(153, 102, 255, 0.7)' }
  };

  // Process data for chart
  useEffect(() => {
    if (!historicalData || Object.keys(historicalData).length === 0) return;

    let timestamps = [];
    let values = [];
    
    if (timeRange === 'daily') {
      // Group data by day and calculate daily averages
      const dailyData = {};
      
      Object.keys(historicalData).forEach(timestamp => {
        // Process all data from the start timestamp
        if (parseInt(timestamp) >= 1743919923) {
          const date = new Date(parseInt(timestamp) * 1000);
          const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          
          if (!dailyData[dayKey]) {
            dailyData[dayKey] = {
              timestamp: parseInt(timestamp),
              values: [],
              count: 0
            };
          }
          
          if (historicalData[timestamp][dataType] !== undefined) {
            dailyData[dayKey].values.push(historicalData[timestamp][dataType]);
            dailyData[dayKey].count++;
          }
        }
      });
      
      // Calculate averages and sort by day
      Object.keys(dailyData)
        .sort()
        .forEach(day => {
          if (dailyData[day].count > 0) {
            const avg = dailyData[day].values.reduce((sum, val) => sum + val, 0) / dailyData[day].count;
            timestamps.push(formatDate(dailyData[day].timestamp));
            values.push(avg);
          }
        });
    } 
    else if (timeRange === 'weekly') {
      // Group data by week and calculate weekly averages
      const weeklyData = {};
      const startDate = new Date(1743919923 * 1000); // Your start timestamp
      
      // Process all data from the start timestamp
      Object.keys(historicalData).forEach(timestamp => {
        if (parseInt(timestamp) >= 1743919923) {
          const date = new Date(parseInt(timestamp) * 1000);
          
          // Calculate days since start
          const daysSinceStart = Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
          // Calculate which week this belongs to (0-indexed)
          const weekIndex = Math.floor(daysSinceStart / 7);
          
          // Calculate the start and end of this week
          const weekStartDate = new Date(startDate);
          weekStartDate.setDate(startDate.getDate() + (weekIndex * 7));
          
          const weekEndDate = new Date(weekStartDate);
          weekEndDate.setDate(weekStartDate.getDate() + 6);
          
          const weekKey = `week_${weekIndex}`;
          
          if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = {
              values: [],
              startDate: weekStartDate,
              endDate: weekEndDate
            };
          }
          
          if (historicalData[timestamp][dataType] !== undefined) {
            weeklyData[weekKey].values.push(historicalData[timestamp][dataType]);
          }
        }
      });
      
      // Calculate averages and create arrays for chart
      Object.keys(weeklyData)
        .sort((a, b) => {
          // Sort by week index
          const weekA = parseInt(a.split('_')[1]);
          const weekB = parseInt(b.split('_')[1]);
          return weekA - weekB;
        })
        .forEach(week => {
          const weekValues = weeklyData[week].values;
          if (weekValues.length > 0) {
            const average = weekValues.reduce((sum, val) => sum + val, 0) / weekValues.length;
            timestamps.push(formatWeekRange(weeklyData[week].startDate, weeklyData[week].endDate));
            values.push(average);
          }
        });
    } 
    else {
      // Regular hourly view - last hour or last 24 hours
      const hours = parseInt(timeRange);
      const now = Math.floor(Date.now() / 1000);
      const startTime = now - (hours * 60 * 60);
      
      Object.keys(historicalData)
        .filter(timestamp => parseInt(timestamp) >= startTime)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .forEach(timestamp => {
          if (historicalData[timestamp][dataType] !== undefined) {
            timestamps.push(formatTime(parseInt(timestamp)));
            values.push(historicalData[timestamp][dataType]);
          }
        });
    }
    
    // Update chart data
    setChartData({
      labels: timestamps,
      datasets: [
        {
          label: chartConfig[dataType].label,
          data: values,
          backgroundColor: chartConfig[dataType].color,
          borderColor: chartConfig[dataType].color.replace('0.7', '1'),
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.3
        }
      ]
    });
  }, [historicalData, dataType, timeRange])

  return (
    <div className="chart-container">
      <h2>Sensor History</h2>
      <div className="chart-controls">
        <select 
          value={dataType} 
          onChange={(e) => setDataType(e.target.value)}
        >
          <option value="air_temp">Air Temperature</option>
          <option value="humidity">Humidity</option>
          <option value="water_temp">Water Temperature</option>
          <option value="ph">pH Level</option>
          <option value="tds">TDS</option>
        </select>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="1">Last Hour</option>
          <option value="24">Last 24 Hours</option>
          <option value="daily">Daily Average</option>
          <option value="weekly">Weekly Average</option>
        </select>
      </div>
      <div className="chart-wrapper">
        <Line 
          ref={chartRef}
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                ticks: {
                  maxRotation: 45,
                  minRotation: 45
                }
              },
              y: {
                beginAtZero: false
              }
            },
            plugins: {
              legend: {
                display: true,
                position: 'top'
              },
              tooltip: {
                mode: 'index',
                intersect: false
              }
            }
          }}
        />
      </div>
    </div>
  );
}

export default SensorChart;