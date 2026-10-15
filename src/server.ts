import { Server } from "http";
import app from "./app";
import config from "./app/config";

let server: Server;

async function bootstrap() {
  try {
    server = app.listen(config.port, () => {
      console.log(`🚀 DevAssess Server is running on port ${config.port}`);
      console.log(
        `🩺 Health check: http://localhost:${config.port}/api/v1/health`,
      );
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }

  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.log("Server closed gracefully");
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  };

  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception detected:", error);
    exitHandler();
  });

  process.on("unhandledRejection", (error) => {
    console.error("Unhandled Rejection detected:", error);
    exitHandler();
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received");
    if (server) {
      server.close();
    }
  });
}

bootstrap();
