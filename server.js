import express from "express";
import ViteExpress from "vite-express";
import bodyParser from "body-parser";

import apiRoutes from "./src-server/api-routes.js";
import { loadExistenceCourses } from "./src-server/courses.js";
import { enableJwtDebugMode } from "./src-server/jwt-middleware.js";
import prisma from "./src-server/prisma-object.js";


const app = express();


// Удаление прогресса по всем курсам
console.log("УДАЛЯЕМ ПРОГРЕСС ПОЛЬЗОВАТЕЛЕЙ ПО ВСЕМ КУРСАМ ПРИ ЗАПУСКЕ СЕРВЕРА");
await prisma.progress.deleteMany({});

// Единоразово создаём в базе данных новых пользователей
await prisma.user.deleteMany({});
await prisma.user.createMany({
    data: [
        {
            username: "admin",
            password: "admin",
            role: "admin"
        },
        {
            username: "user",
            password: "user",
            role: "user",
        },
        {
            username: "suetlana",
            password: "12345",
            role: "user",
        },
    ],
});

console.log("Пользователи, зарегистрированные на сайте: ");
console.dir(await prisma.user.findMany({}), { depth: null });


/**
 * Middleware, пишущий логи в консоль
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {import("express").NextFunction} next 
 */
const logger = (req, res, next) => {
    console.log(`\n[INFO]: new request: ${req.url}`);
    next();
};

app.use(logger);

// bodyParser - позволяет удобно парсить тело post-запросов
app.use(bodyParser.json());

// Используем папку course для получения статических файлов
app.use('/courses', express.static('courses'));

app.use(ViteExpress.static());

app.use('/api', apiRoutes);

await loadExistenceCourses(app);

const port = process.env.PORT || 3000;

// Перед запуском сервера в продакшн необходимо выполнить команду npm run build,
// А также раскомментировать строку ниже
//                                  [v]
ViteExpress.config({ mode: "production" }) 

// Отключает функционал аутентификации (не выполняются проверки на корректность токенов и права администратора)
enableJwtDebugMode();

ViteExpress.listen(app, port, () => console.log(`NEW Server is listening.\n You can connect to it by http://127.0.0.1:${port}`));


