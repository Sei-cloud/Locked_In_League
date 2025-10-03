// backend/seed.js
const mongoose = require('mongoose');
require('dotenv').config();
const Team = require('./models/Team');

const teams = [
  {
    name: 'Locked In Lions',
    roster: [
      { name: 'John Doe', position: 'PG', number: 1, height: '6-2', weight: '180', age: 24, ppg: 18.5, fg: 0.45, assists: 7.2, rebounds: 4.1 },
      { name: 'Mike Smith', position: 'SG', number: 2, height: '6-4', weight: '195', age: 26, ppg: 15.3, fg: 0.42, assists: 3.8, rebounds: 5.0 }
    ]
  },
  {
    name: 'League Legends',
    roster: [
      { name: 'Alex Lee', position: 'SF', number: 11, height: '6-7', weight: '210', age: 28, ppg: 21.7, fg: 0.48, assists: 4.5, rebounds: 7.8 },
      { name: 'Chris Kim', position: 'PF', number: 22, height: '6-9', weight: '230', age: 30, ppg: 13.9, fg: 0.50, assists: 2.1, rebounds: 9.3 }
    ]
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await Team.deleteMany({});
  await Team.insertMany(teams);
  console.log('Seeded teams and players!');
  mongoose.disconnect();
}

seed();
