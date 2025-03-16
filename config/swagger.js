import swaggerAutogen from "swagger-autogen";
import swaggerUi from "swagger-ui-express";

const doc = {
    info: {
        title: "Your API Name",
        description: "API documentation generated using Swagger Autogen",
        version: "1.0.0",
    },
    servers: [
        {
            url: "http://localhost:10000", // Adjust based on your API URL
        },
    ],
};

const outputFile = "./swagger-output.json"; // File where Swagger documentation will be generated
const endpointsFiles = ["./server.js", "./routes/adminRoutes.js", "./routes/authRoutes.js"]; // Paths to route files

// Generate Swagger documentation
swaggerAutogen()(outputFile, endpointsFiles).then(() => {
    console.log("Swagger documentation generated!");
});

export { swaggerUi };
