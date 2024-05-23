import express from 'express';
import { authenticateJWT, requireAdmin } from './jwt-middleware.js';
import { getCourseByPath, courses, isCourseExists, coursesDir, addCourse } from './courses.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

import unzipper from 'unzipper';

export const coursesRoutes = express.Router();

export default coursesRoutes;


coursesRoutes.use('/', authenticateJWT);

/**
 * Корень курсов
 * 
 * Будет отправлять список всех доступных для прохождения курсов, их названия и описания, их иконки (если есть) и т.д.
 */
coursesRoutes.get('/', (req, res) => {
    /** @type {Array<{courseName: string, coursePath: string}>} */
    const coursesInfo = [];

    for (const [path, courseBundle] of Object.entries(courses)) {
        const courseHeader = courseBundle.course.courseHeaders.courseName;
        coursesInfo.push({
            courseName: courseHeader,
            coursePath: path,
        });
    }

    res.json({
        courses: coursesInfo,
    });
});

/**
 * Информация об определённом курсе
 * 
 * Будет отправлять инфу о выбранном курсе + отправлять список модулей, уроков и число тестов в данном уроке
 */
coursesRoutes.get('/:coursePath', (req, res) => {
    const courseBundle = getCourseByPath(req.params.coursePath);
    if (courseBundle === null) {
        return res.status(404).send(`Course ${req.params.coursePath} not founded`);
    }

    return res.json(courseBundle.course.courseHeaders);
});


/**
 * Информация об определённом уроке
 * 
 * Будет отправлять текст урока
 */
coursesRoutes.get('/:coursePath/modules/:module/lessons/:lesson', (req, res) => {
    const courseBundle = getCourseByPath(req.params.coursePath);
    if (courseBundle === null) {
        return res.status(404).send(`Course ${req.params.coursePath} not founded`);
    }

    const course = courseBundle.course;
    const result = course.getLessonFor(req.params.module, req.params.lesson);
    if (!result.success) {
        return res.status(404).send(result.reason);
    }

    return res.json(result.data);
});


/**
 * Инфа о тесте
 * 
 * Будет искать указанный в запросе тест и возвращать инфу о нём
 */
coursesRoutes.get('/:coursePath/modules/:module/lessons/:lesson/tasks/:task', (req, res) => {
    const courseBundle = getCourseByPath(req.params.coursePath);
    if (courseBundle === null) {
        return res.status(404).send(`Course ${req.params.coursePath} not founded`);
    }

    const course = courseBundle.course;
    const result = course.findTaskParams(req.params.module, req.params.lesson, req.params.task);
    if (!result.success) {
        return res.status(404).send(result.reason);
    }
    return res.json(result.data);
});

/**
 * Инфа о действии героя
 * 
 * Будет искать указанное в запросе действие героя и возвращать её
 */
coursesRoutes.get('/:coursePath/modules/:module/lessons/:lesson/actions/:action', (req, res) => {
    const courseBundle = getCourseByPath(req.params.coursePath);
    if (courseBundle === null) {
        return res.status(404).send(`Course ${req.params.coursePath} not founded`);
    }

    const actions = courseBundle.action;
    const result = actions.getActionForLesson(req.params.action, req.params.module, req.params.lesson);
    if (!result.success) {
        return res.status(404).send(result.reason);
    }
    return res.json(result.response);
});


/**
 * Инфа о реакции героя на тесты
 * 
 * Будет искать реакции героя на указанный в запросе номер попытки решения теста
 */
coursesRoutes.get('/:coursePath/tests/heroPhrases/:num', (req, res) => {
    const courseBundle = getCourseByPath(req.params.coursePath);
    if (courseBundle === null) {
        return res.status(404).send(`Course ${req.params.coursePath} not founded`);
    }

    const response = courseBundle.hero.getHeroTestReactions(req.params.num);
    if (!response.success) {
        return res.status(404).send(response.reason);
    }
    return res.json({
        data: response.result,
    });
});

const upload = multer({ dest: 'tmps/' });

coursesRoutes.post('/upload', requireAdmin, upload.single('archive'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        const filePath = req.file.path;
        const extractPath = path.join("tmps/", 'extracted');

        // Создание директории, если не существует
        if (!fs.existsSync(extractPath)) {
            fs.mkdirSync(extractPath, { recursive: true });
        }

        // Распаковка архива
        fs.createReadStream(filePath)
            .pipe(unzipper.Extract({ path: extractPath }))
            .on('close', () => {
                // Удаление загруженного файла после распаковки
                fs.unlinkSync(filePath);

                // Проверяем курс на то, что он уже существует
                const filename = fs.readdirSync(extractPath).at(0);
                let result = isCourseExists(filename);
                if (!result.success) {
                    fs.unlinkSync(`${extractPath}/${filename}`); // Удаляем файл
                    return res.status(403).send(result.reason);
                }

                // Копируем файл к курсам
                fs.cpSync(`${extractPath}/${filename}`, `${coursesDir}/${filename}`, { recursive: true });

                fs.unlinkSync(`${extractPath}/${filename}`); // Удаляем файл

                result = addCourse(`${coursesDir}/${filename}`);
                if (!result.success) {
                    fs.unlinkSync(`${coursesDir}/${filename}`); // Удаляем файл
                    return res.status(403).send(result.reason);
                }

                return res.send(`File '${filename}' uploaded and extracted successfully with name ${result.coursePathber}.`);
            })
            .on('error', (err) => {
                console.error('[ERRO]: Error while extracting archive:', err);
                res.status(500).send('Error while extracting archive.');
            });
    } catch (err) {
        console.error('[ERRO]: Error:', err);
        res.status(500).send('An error occurred.');
    }
});

coursesRoutes.delete('/:coursePath', requireAdmin, (req, res) => {

});
