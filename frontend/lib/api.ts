import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    withCredentials: true,
    timeout: 30000, // 30 second timeout for slow operations like email sending
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;