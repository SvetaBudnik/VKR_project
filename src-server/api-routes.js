import express from 'express';
import { changeLogin, changePassword, loginUser, authenticateJWT } from './jwt-middleware.js';
import coursesRoutes from './courses-routes.js';
import prisma from './prisma-object.js';
import { getCourseByPath } from './courses.js';

export const apiRoutes = express.Router();

export default apiRoutes;


apiRoutes.use('/courses', coursesRoutes);

// TODO: Перенести на /user/login

apiRoutes.post('/login', loginUser);

apiRoutes.post('/login/change-login', authenticateJWT, changeLogin);
apiRoutes.post('/login/change-password', authenticateJWT, changePassword);

// По запросу - возвращает статистику пользователя по курсу 
// (число тестовых баллов; доп поля курса)
apiRoutes.get('/user/stats/:coursename', authenticateJWT, async (req, res) => {
    const user = await prisma.user.findUnique({
        where: {
            username: req.user.user,
        }
    });
    if (!user) {
        return res.status(401).send("User not founded");
    }

    let progress = await prisma.progress.findUnique({
        where: {
            userId_coursename: {
                userId: user.id,
                coursename: req.params.coursename,
            }
        },
    });

    // Если прогресса для такого курса для такого человека ещё нет, то создаём его
    if (!progress) {
        // Структура, которую будем заполнять
        const courseInfo = {
            /** @type {Object<string, boolean>} */ lessons: {},
            /** @type {Object<string, number>} */ tasks: {},
            meta_fields: {
                /** @type {string[]} */ achievements: [],
                /** @type {Object<string, number>} */ variables: {},
            },
        };
        // Получаем информацию о курсе
        const courseBundle = getCourseByPath(req.params.coursename);
        if (!courseBundle) {
            return res.status(404).send(`Course ${req.params.coursename} not founded`);
        }

        // Заполняем информацию об уроках и тестах
        for (const moduleNum of Object.keys(courseBundle.course.courseHeaders.modules)) {
            const modulePaths = courseBundle.course.courseHeaders.modules[+moduleNum];

            for (const lessonNum of Object.keys(modulePaths.lessons)) {
                const lessonInfo = modulePaths.lessons[+lessonNum];
                const str = `${moduleNum}-${lessonNum}`;
                courseInfo.lessons[str] = false;
                
                if (lessonInfo.tasksCount != 0) {
                    courseInfo.tasks[str] = 0;
                }
            }
        }
        // Создаём новую запись в БД
        progress = await prisma.progress.create({
            data: {
                coursename: req.params.coursename,
                userId: user.id,
                progress: JSON.stringify(courseInfo),
            },
        });
    }

    // Возвращаем прогресс
    return res.json(JSON.parse(progress.progress));
});

/** 
 * Получает на вход JSON файл следующего содержания
 * ```
 * {
 *     lessons?: {
 *         <name>: boolean
 *     },
 *     tasks?: {
 *         <name>: score,
 *     },
 *     meta_fields?: {
 *         achievements?: [
 *             <name>
 *         ],
 *         variables?: {
 *             <name>: newScore
 *         }
 *     }
 * }
 * ```authenticateJWT,
 */
apiRoutes.put('/user/stats/:coursename', authenticateJWT, async (req, res) => {
    console.dir(req.body, { depth: null });
    const { lessons, tasks, meta_fields } = req.body;

    const user = await prisma.user.findUnique({
        where: {
            username: req.user.user,
        }
    });
    if (!user) {
        return res.status(401).send("User not founded");
    }

    const progress = await prisma.progress.findUnique({
        where: {
            userId_coursename: {
                userId: user.id,
                coursename: req.params.coursename,
            }
        },
    });
    if (!progress) {
        return res.status(404).send(`Course '${req.params.coursename}' not founded`);
    }

    /**
     * @type {{lessons: Object<string, boolean>, tasks: Object<string, number>, meta_fields: {achievements: string[], variables: Object<string, number>}}}
     */
    const progressJson = JSON.parse(progress.progress);

    if (lessons) {
        for (const [name, value] of Object.entries(lessons)) {
            progressJson.lessons[name] = value;
        }
    }
    if (tasks) {
        for (const [name, value] of Object.entries(tasks)) {
            progressJson.tasks[name] = value;
        }
    }
    if (meta_fields) {
        if (meta_fields.achievements) {
            for (const name of meta_fields.achievements) {
                progressJson.meta_fields.achievements.push(name);
            }
        }
        if (meta_fields.variables) {
            for (const [name, value] of meta_fields.variables) {
                progressJson.meta_fields.variables[name] = value;
            }
        }
    }

    await prisma.progress.update({
        where: {
            userId_coursename: {
                userId: user.id,
                coursename: req.params.coursename,
            }
        },
        data: {
            progress: JSON.stringify(progressJson),
        },
    });

    return res.json(progressJson);
});

apiRoutes.get('/*', (req, res) => {
    res.status(404).send('API not founded');
});


