import { addRoute, startRouter } from './router.js';
import { LandingView } from './views/landing.js';
import { LoginView } from './views/login.js';
import { AdminDashboard, AdminTeachers, AdminStudents, AdminClasses } from './views/admin.js';
import { TeacherDashboard, TeacherClass } from './views/teacher.js';
import { StudentDashboard, StudentClass } from './views/student.js';

addRoute('#/home', LandingView, null);
addRoute('#/login', LoginView, null);

addRoute('#/admin', AdminDashboard, ['admin']);
addRoute('#/admin/teachers', AdminTeachers, ['admin']);
addRoute('#/admin/students', AdminStudents, ['admin']);
addRoute('#/admin/classes', AdminClasses, ['admin']);

addRoute('#/teacher', TeacherDashboard, ['teacher']);
addRoute('#/teacher/class/:id', TeacherClass, ['teacher']);

addRoute('#/student', StudentDashboard, ['student']);
addRoute('#/student/class/:id', StudentClass, ['student']);

startRouter();
