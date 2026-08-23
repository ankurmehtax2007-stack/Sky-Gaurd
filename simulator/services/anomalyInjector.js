const frozenStations = new Map();

export const injectAnomaly = (reading) => {

    // Check whether this station is already frozen
    const frozen = frozenStations.get(reading.stationId);

    if (frozen) {

        // Keep the selected sensor at the frozen value
        reading[frozen.sensor] = frozen.value;

        // One reading has been consumed
        frozen.remaining--;

        // End the frozen anomaly
        if (frozen.remaining <= 0) {
            frozenStations.delete(reading.stationId);
        }

        return reading;
    }

    // Only ~5% of readings become anomalous
    const shouldInject = Math.random() < 0.1;

    if (!shouldInject) {
        return reading;
    }

    // Choose anomaly type
    const anomalyType = Math.floor(Math.random() * 4) + 1;

    const direction = Math.random() < 0.5 ? 1 : -1;

    switch (anomalyType) {
        case 1: {
            const change = 10 + Math.random() * 10;
            reading.temperature += change * direction;
            break;
        }

        case 2: {
            const change = 20 + Math.random() * 20;
            reading.humidity += change * direction;
            break;
        }

        case 3: {
            const change = 30 + Math.random() * 30;
            reading.pressure += change * direction;
            break;
        }

        // Frozen sensor
        case 4: {

            const sensors = [
                "temperature",
                "humidity",
                "pressure"
            ];

            const sensor =
                sensors[Math.floor(Math.random() * sensors.length)];

            frozenStations.set(reading.stationId, {
                sensor,
                value: reading[sensor],
                remaining: 10
            });

            break;
        }
    }

    return reading;
};
