import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../shared/api";
import LectureCard from "../../shared/components/LectureCard";
import JoinModal from "../../shared/components/JoinModal";
import { Lecture } from "./types";

function LectureList() {
  const navigate = useNavigate();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const fetchLectures = () => {
    setPageLoading(true);
    api
      .get("/api/lectures")
      .then((res) => setLectures(res.data))
      .catch(() => setLectures([]))
      .finally(() => setPageLoading(false));
  };

  useEffect(() => {
    fetchLectures();
  }, []);

  const filtered = lectures.filter(
    (l) =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.professor.includes(search) ||
      l.major.includes(search)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">강의 목록</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
            >
              + 강의 참여
            </button>
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">로그아웃</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="강의명, 교수명, 전공으로 검색"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        {pageLoading ? (
          <div className="py-20 text-center text-gray-400">불러오는 중...</div>
        ) : filtered.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-gray-500">
              총 <span className="font-semibold text-gray-800">{filtered.length}</span>개 강의
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((lecture) => (
                <LectureCard
                  key={lecture.id}
                  lecture={lecture}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="py-20 text-center text-gray-400">
            <p className="text-lg font-medium">참여한 강의가 없습니다.</p>
            <p className="mt-1 text-sm">인증번호로 강의에 참여해보세요.</p>
          </div>
        )}
      </main>

      {showModal && (
        <JoinModal
          onClose={() => setShowModal(false)}
          onSuccess={fetchLectures}
        />
      )}
    </div>
  );
}

export default LectureList;
