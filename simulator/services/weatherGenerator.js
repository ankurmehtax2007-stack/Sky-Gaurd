import { injectAnomaly } from "./anomalyInjector.js";

const generateReading = (station) => {
    const reading =  {
        stationId: station.stationId,
        timestamp: new Date().toISOString(),
        temperature: station.baseTemperature + ((Math.random() * 1) - 0.5),
        humidity: station.baseHumidity + ((Math.random() * 1) - 0.5),
        pressure: station.basePressure + ((Math.random() * 1) - 0.5)
    };
    return injectAnomaly(reading);
}

export default generateReading;

