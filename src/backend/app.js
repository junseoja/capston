
// 실행
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { router: loginRouter } = require("./routes/login"); // ✅ 변경
const routineRouter = require("./routes/routine"); // ✅ 추가

const app = express();
const PORT = 3000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/", loginRouter);
app.use("/", routineRouter); // ✅ 추가

app.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
});