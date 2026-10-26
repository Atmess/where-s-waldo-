

const API_BASE_URL = import.meta.env.PROD 
  ? 'https://where-s-waldo-3vz9.onrender.com' // 👈 Replace with your actual Render URL when ready
  : 'http://localhost:8080';

export default API_BASE_URL;