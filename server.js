import express from "express";
import ViteExpress from "vite-express";
import { findTaskParams } from "./src/serverModules/serverTaskWorker.js";
import { getCourseInfo, getLessonFor } from './src/serverModules/serverModuleWorker.js'

const app = express();

// Запуск сервера в продакшн
// Перед запуском необходимо выполнить команду npm run build
ViteExpress.config({ mode: "production" }) 

// Используем папку course для получения статических файлов
app.use('/course', express.static('course'));
app.use(ViteExpress.static());

// Кастомные пути для работы сервера (подойдёт для реализации API)
// app.get("/api/getTestData/:module/:lesson/:test", findTest);
app.get("/api/getTaskData/:module/:lesson/:task", (req, res) => {
    const result = findTaskParams(req.params.module, req.params.lesson, req.params.task);
    if (!result.success) {
        res.status(404).send(result.reason);
        return;
    }
    res.send(result.data);
});

app.get("/api/getCourseInfo", (_, res) => {
    const data = getCourseInfo();
    if (data == null) {
        const reason = "Internal error on server side";
        res.status(404).send(reason);
        return;
    }

    res.send(data);
});

app.get("/api/getLessonData/:module/:lesson", async (req, res) => {
    const result = getLessonFor(req.params.module, req.params.lesson);
    if (!result.success) {
        res.status(404).send(result.reason);
    } else {
        res.send(result.data);
    }
});

// В идеале - определить вот такую функцию, чтобы выкидывало все некорректные запросы к API сервера
app.get("/api/*", (req, res) => {
    res.status(404).send("This page doesn't exists");
});

const port = process.env.PORT || 3000;
ViteExpress.listen(app, port, () => console.log(`Server is listening at port ${port} ...`));
