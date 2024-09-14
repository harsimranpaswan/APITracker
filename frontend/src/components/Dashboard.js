import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const [apiHits, setApiHits] = useState([]);
  const [browserData, setBrowserData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);
  const [endpoint, setEndpoint] = useState('');
  const [method, setMethod] = useState('GET');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('IP');

  const COLORS = {
    Chrome: '#4285F4',
    Firefox: '#FF7139',
    Safari: '#00ACED',
    Edge: '#0078D7',
    Other: '#A9A9A9'
  };

  useEffect(() => {
    fetchApiHits();
  }, []);

  useEffect(() => {
    processBarChartData(apiHits);
  }, [chartType, apiHits]); 

  const fetchApiHits = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/hits');
      setApiHits(response.data);
      processBrowserData(response.data);
      processBarChartData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching API hits:', error);
      setError('Error fetching API hits');
      setLoading(false);
    }
  };

  const trackApiHit = async () => {
    try {
      await axios.post('http://localhost:5000/track', { endpoint, method });
      // alert('API Hit Tracked Successfully');
      fetchApiHits();
      setEndpoint('');
      setMethod('GET');
    } catch (error) {
      console.error('Error tracking API hit:', error);
      alert('Error tracking API hit');
    }
  };

  const processBrowserData = (data) => {
    const browserCount = data.reduce((acc, hit) => {
      const userAgent = hit.user_agent.toLowerCase();
      let browser;
      if (userAgent.includes('chrome')) browser = 'Chrome';
      else if (userAgent.includes('firefox')) browser = 'Firefox';
      else if (userAgent.includes('safari')) browser = 'Safari';
      else if (userAgent.includes('edge')) browser = 'Edge';
      else browser = 'Other';
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {});

    const formattedData = Object.keys(browserCount).map(browser => ({
      name: browser,
      value: browserCount[browser],
      color: COLORS[browser]
    }));

    setBrowserData(formattedData);
  };

  const processBarChartData = (data) => {
    let countData;
    if (chartType === 'IP') {
      countData = data.reduce((acc, hit) => {
        const ip = hit.ip_address;
        acc[ip] = (acc[ip] || 0) + 1;
        return acc;
      }, {});
    } else if (chartType === 'Request Type') {
      countData = data.reduce((acc, hit) => {
        const requestType = hit.request_type;
        acc[requestType] = (acc[requestType] || 0) + 1;
        return acc;
      }, {});
    }

    const formattedData = Object.keys(countData).map(key => ({
      name: key,
      count: countData[key]
    }));

    setBarChartData(formattedData);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="dashboard">
      <header className="App-header">
        <h1>API Tracking Dashboard</h1>
        <div>
        <input
          type="text"
          placeholder="Enter the endpoint"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
        />
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
        <button onClick={trackApiHit}>Track</button>
      </div>
      </header> 
      <div className='chart-container'>
      <div className='pie-chart-container'>
      <h2>API Hits by Browser</h2>
      <PieChart width={400} height={400}>
        <Pie
          data={browserData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={150}
        >
          {browserData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Legend />
      </PieChart>
      </div>
      <div className='bar-chart-container'>
      <h2>API Hits by {chartType}</h2>
      <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
        <option value="IP">IP Address</option>
        <option value="Request Type">Request Type</option>
      </select>
      <BarChart width={600} height={300} data={barChartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#8884d8" />
      </BarChart>
      </div>
      </div>
      <h2>API Hits Table</h2>
      <table>
        <thead>
          <tr>
            <th>Request ID</th>
            <th>Request Type</th>
            <th>Request Time</th>
            <th>IP Address</th>
            <th>OS</th>
            <th>User Agent</th>
          </tr>
        </thead>
        <tbody>
          {apiHits.map(hit => (
            <tr key={hit.id}>
              <td>{hit.request_id}</td>
              <td>{hit.request_type}</td>
              <td>{new Date(hit.request_time).toLocaleString()}</td>
              <td>{hit.ip_address}</td>
              <td>{hit.os}</td>
              <td>{hit.user_agent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
