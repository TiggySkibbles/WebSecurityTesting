/**
 * API client — drop-in replacement for the axios-based api.jsx
 * Uses native fetch() with same-origin credentials and CSRF support.
 */

const BASE_URL = '/api/';

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

async function request(method, url, { body = null, isFormData = false, responseType = 'json' } = {}) {
    const fullUrl = url.startsWith('http') ? url : BASE_URL + url;

    const headers = {};
    const csrftoken = getCookie('csrftoken');
    if (csrftoken) {
        headers['X-CSRFToken'] = csrftoken;
    }

    if (body && !isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const options = {
        method,
        headers,
        credentials: 'same-origin',
    };

    if (body) {
        options.body = isFormData ? body : JSON.stringify(body);
    }

    const response = await fetch(fullUrl, options);

    if (!response.ok) {
        // Try to parse error body
        let errorData = null;
        try {
            errorData = await response.json();
        } catch (e) {
            // non-JSON error
        }
        const error = new Error(`HTTP ${response.status}`);
        error.status = response.status;
        error.response = { data: errorData, status: response.status };
        throw error;
    }

    if (responseType === 'blob') {
        return { data: await response.blob() };
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return { data: null, status: 204 };
    }

    const data = await response.json();
    return { data, status: response.status };
}

const api = {
    get(url, options) {
        return request('GET', url, options);
    },
    post(url, body, options = {}) {
        const isFormData = body instanceof FormData;
        return request('POST', url, { body, isFormData, ...options });
    },
    patch(url, body, options = {}) {
        return request('PATCH', url, { body, ...options });
    },
    delete(url, options) {
        return request('DELETE', url, options);
    },
};

export default api;
