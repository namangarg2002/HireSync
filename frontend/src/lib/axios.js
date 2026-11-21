import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL

console.log("API_URL", API_URL);

const axiosInstance = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true  //browser will send the cookies to server automatically, on every single req

});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await window.Clerk?.session?.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;