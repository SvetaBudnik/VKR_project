import baseUrl from '/src/components/baseUrl';
import {ref} from 'vue';

export const course = ref(null);
// export const modules = ref(null);

function generateLinksForLessons() {
    const modules = course.value.modules;
    
    for (const moduleNum in modules) {
        const module = modules[moduleNum];

        for (const lessonNum in module.lessons) {
            const lesson = module.lessons[lessonNum];

            lesson.teorHtmlRef = `/lessons/${module.moduleNumber}/${lesson.lessonNumber}`;
            if (lesson.tasksCount > 0) {
                lesson.testHtmlRef = `/tests/${module.moduleNumber}/${lesson.lessonNumber}/1`;
            }
        }
    }
}

export async function getModules() {
    if (course.value != null) {
        console.log('Данные модулей уже загружены. Пропускаем...');
        return true;
    }
    
    const response = await fetch(`${baseUrl}api/getCourseInfo`, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    if (!response.ok) {
        const desc = await response.text();
        console.log(`Server responsed ${response.status}: ${desc}`)
        return false;
    }
    
    const data = await response.json();
    course.value = data;

    generateLinksForLessons();
    
    return true;
}

export function getNumLessonsInModule(_module) {
    // const module = course.value.modules.find((el) => el.moduleNumber == _module); // TODO: DELETE THIS
    const module = course.value.modules[_module];
    if (module == null)
        return null;
    return Object.keys(module.lessons).length;
}

export function getLessonsIn(_module) {
    const module = course.value.modules[_module];
    if (module == null) {
        return null;
    }

    return module.lessons;
}
