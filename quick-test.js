// Copy this entire code block
let lat = 22.540638, lng = 88.353808, count = 0;
const truckId = '8cf20524-e0be-4589-9572-a9efc37b0bf4';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4ZTkzZDE5NC02NGU2LTQ5ODQtODk2My00NjY0NzU4NGIwY2IiLCJyb2xlIjoxLCJpYXQiOjE3Njc2ODU1NzYsImV4cCI6MTc2Nzc3MTk3Nn0.HfXKwgZYxSq4RUT_3qMSPb4tFKXHJU1Vc3zKAorSct8';

async function move() {
  lat += 0.0001; lng += 0.0001; count++;
  const res = await fetch('http://localhost:3000/api/tracking/location', {
    method: 'POST',
    headers: { 
      'Authorization': Bearer , 
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({ 
      truckId, lat, lng, 
      speed: 30 + Math.random() * 10, 
      heading: 45, 
      timestamp: new Date().toISOString() 
    })
  });
  const data = await res.json();
  console.log(? [] Moved to: , , data);
}

const interval = setInterval(move, 3000);
console.log('?? Simulation started! Truck will move every 3 seconds.');
console.log('?? Open Fleet ? Live Tracking page to see the truck move!');
console.log('??  To stop: clearInterval(interval)');

// Send first update immediately
move();
