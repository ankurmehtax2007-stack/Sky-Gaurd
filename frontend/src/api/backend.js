const API_BASE_URL = "http://localhost:3000";

export async function getLatestReadings() {
    const response = await fetch(`${API_BASE_URL}/api/readings`);

    if (!response.ok) {
        throw new Error("Failed to fetch readings");
    }

    return response.json();
}
