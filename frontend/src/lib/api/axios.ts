import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api",
  withCredentials: true, // SANGAT PENTING: Memastikan cookies selalu dikirim/diterima
});

export default api;
