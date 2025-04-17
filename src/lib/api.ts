import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

export const fetchRankings = async () => {
  const response = await api.get('/octagon/rankings');
  return response.data;
};

export const fetchFighters = async () => {
  const response = await api.get('/octagon/fighters');
  return response.data;
};

export const fetchFighter = async (fighterId: string) => {
  const response = await api.get(`/octagon/fighter/${fighterId}`);
  return response.data;
};

export default api;