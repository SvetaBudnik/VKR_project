import { marked } from 'marked';
import fs from 'fs';
import path from 'path';


function readLessonInfo(directory) {
    let result = {
        theory: "",
        tasks: "",
    };

    const filenames = fs.readdirSync(directory);

    filenames.forEach((file) => {
        const filepath = path.join(directory, file);
        const stats = fs.statSync(filepath);

        if (stats.isFile() && file.endsWith(".md")) {
            result.theory = filepath;
        } else if (stats.isFile() && file.endsWith(".json")) {
            result.tasks = filepath;
        }
        else {
            console.error(`Директория курса содержит файл ${filepath}, являющийся несовместимым. Пропускаем...`);
        }
    });

    return result;
}

function readModuleInfo(directory) {
    let result = {
        module: "",
        lessons: {},
    };

    const filenames = fs.readdirSync(directory);

    filenames.forEach((file) => {
        const filepath = path.join(directory, file);
        const stats = fs.statSync(filepath);

        if (stats.isFile() && file.endsWith(".md")) {
            result.module = filepath;
        } else if (stats.isDirectory()) {
            const lessonInfo = readLessonInfo(filepath);
            const lessonNumber = parseInt(file.split(" ").filter((val, _, __) => val.length != 0)[1]);
            result.lessons[lessonNumber] = lessonInfo;
        }
        else {
            console.error(`Директория курса содержит файл ${filepath}, являющийся несовместимым. Пропускаем...`);
        }
    });

    return result;
}

function readCourse(directory) {
    let result = {
        course: "",
        modules: {},
    };

    const filenames = fs.readdirSync(directory);

    filenames.forEach((file) => {
        const filepath = path.join(directory, file);
        const stats = fs.statSync(filepath);

        if (stats.isFile() && file.endsWith(".md")) {
            result.course = filepath;
        } else if (stats.isDirectory()) {
            const moduleInfo = readModuleInfo(filepath);
            const moduleNumber = parseInt(file.split(" ").filter((val) => val.length != 0)[1]);
            result.modules[moduleNumber] = moduleInfo;
        }
        else {
            console.error(`Директория курса содержит файл ${filepath}, являющийся несовместимым. Пропускаем...`);
        }
    });

    return result;
}

function getLessonHeaders(lesson) {
    let headers = {
        lessonName: "",
        tasksCount: 0,
    };

    const lessonFile = fs.readFileSync(lesson.theory).toString();
    const lessonHeaders = lessonFile.match(/^### .+/g);
    if (lessonHeaders == null) {
        console.error(`Заголовок урока ${lesson.theory} неверный. Ожидалось что-то типа '### Название урока'`);
        return null;
    }

    headers.lessonName = lessonHeaders[0].slice(4);

    if (lesson.tasks != "") {
        const testsFile = fs.readFileSync(lesson.tasks).toString();
        if (testsFile != "") {
            const testsJson = JSON.parse(testsFile);
            if (testsJson.data != null) {
                headers.tasksCount = testsJson.data.length;
            }
        }
    }

    return headers;
}

function getModuleHeaders(module) {
    let headers = {
        moduleName: "",
        lessons: {},
    };

    const moduleFile = fs.readFileSync(module.module).toString();
    const moduleHeaders = moduleFile.match(/^## .+/g);
    if (moduleHeaders == null) {
        console.error(`Заголовок модуля ${module.module} неверный. Ожидалось что-то типа '## Название модуля'`);
        return null;
    }

    headers.moduleName = moduleHeaders[0].slice(3);
    for (const key in module.lessons) {
        let lessonHeader = {
            lessonNumber: key,
            lessonTitle: `Урок ${key}`,
            lessonName: "",
            tasksCount: 0,
        };

        const lesHeader = getLessonHeaders(module.lessons[key]);
        if (lesHeader == null) {
            console.error("Произошла ошибка при чтении хедера урока");
            return null;
        }
        lessonHeader.lessonName = lesHeader.lessonName;
        lessonHeader.tasksCount = lesHeader.tasksCount;

        headers.lessons[key] = lessonHeader;
    }

    return headers;
}

function getCourseHeaders(course) {
    if (course == null) return null;

    let headers = {
        courseName: "",
        modules: {},
    };

    const courseFile = fs.readFileSync(course.course).toString();
    const courseHeaders = courseFile.match(/^# .+/g);
    if (courseHeaders == null) {
        console.error("Заголовок курса неверный. Ожидалось что-то типа '# Название курса'");
        return null;
    }
    headers.courseName = courseHeaders[0].slice(2);
    for (const key in course.modules) {
        let moduleHeaders = {
            moduleNumber: key,
            moduleTitle: `Модуль ${key}`,
            moduleName: "",
            lessons: {},
        };

        const modHeaders = getModuleHeaders(course.modules[key]);
        if (modHeaders == null) {
            console.error("Ошибка считывания заголовков модуля");
        } else {
            moduleHeaders.moduleName = modHeaders.moduleName;
            moduleHeaders.lessons = modHeaders.lessons;
            headers.modules[key] = moduleHeaders;
        }
    }

    return headers;
}


const dir = "./course"
export const coursePaths = readCourse(dir);
export const courseInfo = getCourseHeaders(coursePaths);

export function getCourseInfo() {
    return courseInfo;
}

export function getLessonFor(_module, _lesson) {
    const module = coursePaths.modules[_module];
    if (module == null) {
        return {
            success: false,
            reason: `Module ${_module} not founded`,
        };
    }
    const lesson = module.lessons[_lesson];
    if (lesson == null) {
        return {
            success: false,
            reason: `Lesson ${_lesson} not founded`,
        };
    }

    const filepath = lesson.theory;
    let md;
    try { 
        const rawMd = fs.readFileSync(filepath);
        md = rawMd.toString();
    } catch {
        console.error(`Lesson file for lesson ${_lesson} on module ${_module} not founded by path ${filepath}`);
        return {
            success: false,
            reason: `Lesson file for lesson ${_lesson} on module ${_module} not founded`,
        };
    }

    return {
        success: true,
        data: {
            lesson: marked(md).toString(),
        }
    }
}
