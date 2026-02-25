import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3500',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Response Interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // 401 Unauthorized - 토큰 만료 처리
    if (error.response?.status === 401 && originalRequest) {
      // 토큰 갱신 로직 (필요시 구현)
      // const refreshToken = localStorage.getItem("refreshToken");
      // try {
      //   const res = await axios.post("/auth/refresh", { refreshToken });
      //   localStorage.setItem("accessToken", res.data.accessToken);
      //   originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
      //   return api(originalRequest);
      // } catch {
      //   localStorage.removeItem("accessToken");
      //   localStorage.removeItem("refreshToken");
      //   window.location.href = "/login";
      // }
    }

    // 403 Forbidden
    if (error.response?.status === 403) {
      console.error('접근 권한이 없습니다.');
    }

    // 500 Server Error
    if (error.response?.status && error.response.status >= 500) {
      console.error('서버 오류가 발생했습니다.');
    }

    return Promise.reject(error);
  },
);

export default api;
