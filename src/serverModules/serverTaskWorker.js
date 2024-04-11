import { courseInfo, coursePaths } from "./serverModuleWorker.js";
import fs from 'fs';

export function findTaskParams(_module, _lesson, _task) {
    console.log(`getting test for module ${_module}, lesson ${_lesson}, task ${_task}`);

    const module = coursePaths.modules[_module];
    if (module == null) {
        return {
            success: false,
            reason: `Module ${_module} wasn't founded on server`,
        };
    }

    const lesson = module.lessons[_lesson];
    if (lesson == null) {
        return {
            success: false,
            reason: `Lesson ${_lesson} wasn't founded on server for module ${_module}`,
        };
    }
    if (courseInfo.modules[_module].lessons[_lesson].testsCount == 0) {
        return {
            success: false,
            reason: `Lesson ${_lesson} in module ${_module} don't have any tasks`,
        };
    }

    const tasksPath = lesson.tasks;
    const tasks = JSON.parse(fs.readFileSync(tasksPath)).data;
    const requestedTaskInfo = tasks[_task - 1];
    if (requestedTaskInfo == null) {
        return {
            success: false,
            reason: `Task ${_task} not founded in lesson ${_lesson} on module ${_module}`,
        };
    }
    
    requestedTaskInfo.taskNumber = _task;
    return {
        success: true,
        data: requestedTaskInfo,
    };
}

// export function findTest(req, res) {
//     const module = req.params.module;
//     const lesson = req.params.lesson;
//     const test = req.params.test;
//     const data = findTestParams(module, lesson, test);
//     if (data.success) {
//         data.test = test;
//         res.send(data);
//     } else {
//         res.status(404).send("Test not found")
//     }
// }
