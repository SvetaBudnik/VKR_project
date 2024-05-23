import express from "express";
import ViteExpress from "vite-express";
import bodyParser from "body-parser";

import apiRoutes from "./src-server/api-routes.js";
import { addCourse, loadExistenceCourses } from "./src-server/courses.js";
import { enableJwtDebugMode } from "./src-server/jwt-middleware.js";


const app = express();

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
app.use('/course', express.static('course'));
app.use('/hero', express.static('hero'));

app.use(ViteExpress.static());

app.use('/api', apiRoutes);

loadExistenceCourses(app);

const port = process.env.PORT || 3000;

// Перед запуском сервера в продакшн необходимо выполнить команду npm run build,
// А также раскомментировать строку ниже
//                                  [v]
// ViteExpress.config({ mode: "production" }) 

// Отключает функционал аутентификации (не выполняются проверки на корректность токенов и права администратора)
enableJwtDebugMode();

ViteExpress.listen(app, port, () => console.log(`NEW Server is listening at port ${port} ...`));

