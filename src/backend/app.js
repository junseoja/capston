
// 실행
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const loginRouter = require("./routes/login");

const app = express();
const PORT = 3000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/", loginRouter);

app.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
});