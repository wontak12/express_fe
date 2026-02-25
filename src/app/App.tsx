import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../features/auth/Login";
import Register from "../features/auth/Register";
import LectureList from "../features/lectures/LectureList";
import LectureDetail from "../features/lectures/LectureDetail";
import ProfessorLectureList from "../features/professor/ProfessorLectureList";
import ProfessorLectureDetail from "../features/professor/ProfessorLectureDetail";
import ProfessorSubmissions from "../features/professor/ProfessorSubmissions";
import ProfessorCreateLecture from "../features/professor/ProfessorCreateLecture";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/lectures" element={<LectureList />} />
        <Route path="/lectures/:id" element={<LectureDetail />} />
        <Route path="/professor/lectures/new" element={<ProfessorCreateLecture />} />
        <Route path="/professor/lectures" element={<ProfessorLectureList />} />
        <Route path="/professor/lectures/:id" element={<ProfessorLectureDetail />} />
        <Route path="/professor/lectures/:lectureId/assignments/:assignmentId/submissions" element={<ProfessorSubmissions />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
