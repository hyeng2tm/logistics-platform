const getApiUrl = () => {
  // Always use relative path to go through Vite proxy (/api)
  return "";
};

const getHeaders = (customHeaders?: HeadersInit) => {
  const token = localStorage.getItem("access_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (customHeaders) {
    Object.assign(headers, customHeaders);
  }

  return headers;
};

export const apiClient = {
  get: async <T>(endpoint: string, customHeaders?: HeadersInit): Promise<T> => {
    const response = await fetch(`${getApiUrl()}${endpoint}`, {
      method: "GET",
      headers: getHeaders(customHeaders),
    });

    if (response.status === 401) {
      console.warn(
        `[apiClient] 401 Unauthorized on ${endpoint}. Clearing session.`,
      );
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.setItem("force_login", "true");

      // Redirect to logout to clear server session as well
      window.location.href = "/logout";
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      throw new Error(`GET ${endpoint} failed with status ${response.status}`);
    }

    // Some APIs might return 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  },

  post: async <T>(
    endpoint: string,
    body?: unknown,
    customHeaders?: HeadersInit,
  ): Promise<T> => {
    const response = await fetch(`${getApiUrl()}${endpoint}`, {
      method: "POST",
      headers: getHeaders(customHeaders),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      console.warn(`[apiClient] 401 Unauthorized on ${endpoint}. Clearing session.`);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.setItem('force_login', 'true');
      window.location.href = '/logout';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      throw new Error(`POST ${endpoint} failed with status ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  },

  put: async <T>(
    endpoint: string,
    body?: unknown,
    customHeaders?: HeadersInit,
  ): Promise<T> => {
    const response = await fetch(`${getApiUrl()}${endpoint}`, {
      method: "PUT",
      headers: getHeaders(customHeaders),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      console.warn(`[apiClient] 401 Unauthorized on ${endpoint}. Clearing session.`);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.setItem('force_login', 'true');
      window.location.href = '/logout';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      throw new Error(`PUT ${endpoint} failed with status ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  },

  delete: async <T>(
    endpoint: string,
    customHeaders?: HeadersInit,
  ): Promise<T> => {
    const response = await fetch(`${getApiUrl()}${endpoint}`, {
      method: "DELETE",
      headers: getHeaders(customHeaders),
    });

    if (response.status === 401) {
      console.warn(`[apiClient] 401 Unauthorized on ${endpoint}. Clearing session.`);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.setItem('force_login', 'true');
      window.location.href = '/logout';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      throw new Error(
        `DELETE ${endpoint} failed with status ${response.status}`,
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  },
};
