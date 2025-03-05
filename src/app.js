import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import session from "express-session";
import passport from "passport";
import { createServer } from "http";
import { Server } from "socket.io";

import requestIp from "request-ip";

import morganMiddleware from "./logger/morgan.logger.js";

import { ApiError } from "./utils/ApiError.js";

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
});

app.set("io", io);

// global middlewares
app.use(
  cors({
    origin: "http://localhost:3000",
    // process.env.CORS_ORIGIN === "*"
    //   ? "*" // This might give CORS error for some origins due to credentials set to true
    //   : process.env.CORS_ORIGIN?.split(","), // For multiple cors origin for production. Refer https://github.com/hiteshchoudhary/apihub/blob/a846abd7a0795054f48c7eb3e71f3af36478fa96/.env.sample#L12C1-L12C12
    credentials: true,
  })
);

app.use(requestIp.mw());

// Rate limiter to avoid misuse of the service and avoid cost spikes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Limit each IP to 500 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req, res) => {
    return req.clientIp; // IP address from requestIp.mw(), as opposed to req.ip
  },
  handler: (_, __, ___, options) => {
    throw new ApiError(
      options.statusCode || 500,
      `There are too many requests. You are only allowed ${
        options.max
      } requests per ${options.windowMs / 60000} minutes`
    );
  },
});

// Apply the rate limiting middleware to all requests
app.use(limiter);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public")); // configure static file to save images locally
app.use(cookieParser());

// required for passport
app.use(
  session({
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  })
); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

app.use(morganMiddleware);
// api routes
import { errorHandler } from "./middlewares/error.middlewares.js";

// * App routes
import userRouter from "./routes/user.routes.js";
import budgetRouter from "./routes/budget.routes.js";

import tranasactionRouter from "./routes/tranasaction.routes.js";

// import masterRouter from "./routes/master.routes.js";

// * App apis
app.use("/api/v1/users", userRouter);
app.use("/api/v1/budget", budgetRouter);

app.use("/api/v1/tranasaction", tranasactionRouter);

// app.use("/api/v1/master", userRouter);
app.use("/", (req, res) => {
  res.status(200).send("<h1>Server is Running Successfullyy</h1>");
});

// common error handling middleware
app.use(errorHandler);

export { httpServer };
