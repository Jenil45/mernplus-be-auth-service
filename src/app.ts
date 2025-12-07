import express from "express";

const app = express();

app.get("/", (req, res) => {
    return res.send("Auth-Service health check 1.0.0");
});

export default app;
