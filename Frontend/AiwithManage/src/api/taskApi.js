const BASE = "http://localhost:4000/api";

const getToken = () => localStorage.getItem("token");

const headers = (auth = false) => ({
  "Content-Type": "application/json",
  ...(auth && getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// AUTH
export const signupApi = (data) =>
  fetch(`${BASE}/auth/signup`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(data),
  }).then((r) => r.json());

export const loginApi = (data) =>
  fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: headers(), 
    body: JSON.stringify(data),
  }).then((r) => r.json()) .then(data => {
    localStorage.setItem("token", data.token)
    return data;
  });

// TASKS
export const getTasksApi = () =>
  fetch(`${BASE}/taskmanage/tasks`, { headers: headers(true) }).then((r) =>
    r.json()
  );

export const getTaskApi = (id) =>
  fetch(`${BASE}/taskmanage/task/${id}`, { headers: headers(true) }).then((r) =>
    r.json()
  );

  export const createTaskApi = (data) =>
    fetch(`${BASE}/taskmanage/addt`, {
      method: "POST",
      headers: headers(true),
      body: JSON.stringify(data),
    }).then((r) => r.json());

export const updateTaskApi = (id, data) =>
  fetch(`${BASE}/taskmanage/updatet/${id}`, {
    method: "PUT",
    headers: headers(true),
    body: JSON.stringify(data),
  }).then((r) => r.json());

export const deleteTaskApi = (id) =>
  fetch(`${BASE}/taskmanage/deletet/${id}`, {
    method: "DELETE",
    headers: headers(true),
  }).then((r) => r.json());
