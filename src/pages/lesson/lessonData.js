import { ref } from 'vue';
import baseUrl from '/src/components/baseUrl';
import { course, getLessonsIn } from '../home/homeData';

export const module = ref(null);
export const lessonsList = ref([]);
export const lesson = ref(null);

export async function getLessonData(_module, _lesson) {
    const response = await fetch(`${baseUrl}api/getLessonData/${_module}/${_lesson}`, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    if (!response.ok) {
        const desc = await response.text();
        console.log(`Server responded error: ${response.status}, ${desc}`);
        return false;
    }

    const data = await response.json();
    
    const moduleInfo = course.value.modules[_module];
    const lessonInfo = moduleInfo.lessons[_lesson];

    module.value = {
        moduleNumber: moduleInfo.moduleNumber,
        moduleTitle: moduleInfo.moduleTitle,
        moduleName: moduleInfo.moduleName,
    }
    lesson.value = {
        lessonNumber: lessonInfo.lessonNumber,
        lessonTitle: lessonInfo.lessonTitle,
        lessonName: lessonInfo.lessonName,
        lessonBody: data.lesson,
    }

    lessonsList.value = [];
    const rawLessonsData = getLessonsIn(_module);
    for (const lessonNum in rawLessonsData) {
        const rawLesson = rawLessonsData[lessonNum];
        lessonsList.value.push({
            lessonName: rawLesson.lessonName,
            teorHtmlRef: rawLesson.teorHtmlRef,
        });
    }

    return true;
}
