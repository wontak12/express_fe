import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../shared/api";
import { Lecture } from "../lectures/types";

function ProfessorLectureList() {
  const navigate = useNavigate();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/professor/lectures")
      .then((res) => {
        console.log("[ProfessorLectureList] lectures:", res.data);
        setLectures(res.data);
      })
      .catch((err) => {
        console.error("[ProfessorLectureList] error:", err);
        setLectures([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">내 강의 목록</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/professor/lectures/new")}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
            >
              + 강의 생성
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("accessToken");
                navigate("/login");
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {loading ? (
          <div className="py-20 text-center text-gray-400">불러오는 중...</div>
        ) : lectures.length === 0 ? (
          <div className="py-20 text-center text-gray-400">등록된 강의가 없습니다.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lectures.map((lecture) => (
              <div
                key={lecture.id}
                onClick={() => navigate(`/professor/lectures/${lecture.id}`)}
                className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3">
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                    {lecture.major}
                  </span>
                </div>
                <h3 className="mb-1 text-base font-bold text-gray-800">{lecture.title}</h3>
                <p className="mb-3 text-sm text-gray-400">{lecture.description}</p>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">{lecture.year}년 {lecture.semester}학기</p>
                  <p className="text-sm text-gray-500">인증코드: <span className="font-mono font-semibold text-gray-700">{lecture.access_code}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ProfessorLectureList;
