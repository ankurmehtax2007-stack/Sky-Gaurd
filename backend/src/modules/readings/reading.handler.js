import{ sensorReadingSchema} from "./reading.validator.js";
import processReading from "./reading.service.js";

const handleReading = (data) => {
    const validatedData = sensorReadingSchema.parse(data);

    processReading(validatedData);
};

export default handleReading;