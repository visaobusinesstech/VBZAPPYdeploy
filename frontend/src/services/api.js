import axios from "axios";

const getBaseUrl = (url) => {
	if (!url) return url;
	if (url.startsWith("http://") || url.startsWith("https://")) return url;
	return `https://${url}`;
};

const baseURL = getBaseUrl(process.env.REACT_APP_BACKEND_URL);

const api = axios.create({
	baseURL,
	withCredentials: true,
});

export const openApi = axios.create({
	baseURL
});

export default api;
