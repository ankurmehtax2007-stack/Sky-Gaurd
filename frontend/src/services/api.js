const API_BASE_URL = "http://localhost:8000";

export async function getLatestReadings() {
  const response = await fetch(`${API_BASE_URL}/api/readings`);

  if (!response.ok) {
    throw new Error("Failed to fetch readings");
  }

  return response.json();
}

export async function getStationReadings(stationId) {
  const response = await fetch(
    `${API_BASE_URL}/api/readings/${stationId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch station readings");
  }

  return response.json();
}

export async function getAnomalies() {
  const response = await fetch(
    `${API_BASE_URL}/api/anomalies`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch anomalies");
  }

  return response.json();
}