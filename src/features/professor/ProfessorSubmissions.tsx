import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../shared/api";

interface SubmissionItem {
  order: number;
  type: "text" | "image" | "video";
  content?: string;
  url?: string;
}

interface Submission {
  id: number;
  student_id: number;
  student_name: string;
  submit_type: string;
  submitted_at: string;
  items: SubmissionItem[];
}

function formatDate(str: string): string {
  const d = new Date(str);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function ProfessorSubmissions() {
  const { lectureId, assignmentId } = useParams<{ lectureId: string; assignmentId: string }>();
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Submission | null>(null);

  useEffect(() => {
    if (!lectureId || !assignmentId) return;
    api
      .get(`/api/professor/lectures/${lectureId}/assignments/${assignmentId}/submissions`)
      .then((res) => setSubmissions(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lectureId, assignmentId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-400">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <button
            onClick={() => navigate(`/professor/lectures/${lectureId}`)}
            className="text-gray-400 hover:text-gray-600"
          >
            ← 뒤로
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-800">제출 현황</h1>
            <p className="text-xs text-gray-400">과제 #{assignmentId}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {submissions.length === 0 ? (
          <div className="py-20 text-center text-gray-400">제출된 과제가 없습니다.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                  <th className="px-4 py-3 text-left font-medium">학생</th>
                  <th className="px-4 py-3 text-left font-medium">제출 형식</th>
                  <th className="px-4 py-3 text-left font-medium">항목 수</th>
                  <th className="px-4 py-3 text-left font-medium">제출 시각</th>
                  <th className="px-4 py-3 text-left font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{sub.student_name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {[...new Set(sub.items.map((i) => i.type))].map((type) => (
                          <span
                            key={type}
                            className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600"
                          >
                            {type === "text" ? "텍스트" : type === "image" ? "이미지" : "영상"}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{sub.items.length}개</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(sub.submitted_at)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(sub)}
                        className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        상세 보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* 상세 모달 */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <p className="text-sm font-bold text-gray-800">{selected.student_name}</p>
                <p className="text-xs text-gray-400">{formatDate(selected.submitted_at)}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-3">
              {selected.items
                .sort((a, b) => a.order - b.order)
                .map((item, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-200 p-3">
                    <p className="mb-2 text-xs font-medium text-gray-400">
                      {item.type === "text" ? "텍스트" : item.type === "image" ? "이미지" : "영상"} #{idx + 1}
                    </p>

                    {item.type === "text" && (
                      <p className="whitespace-pre-wrap text-sm text-gray-700">{item.content}</p>
                    )}

                    {item.type === "image" && item.url && (
                      <div>
                        <img
                          src={item.url}
                          alt={`제출 이미지 ${idx + 1}`}
                          className="w-full rounded-lg object-contain max-h-64"
                        />
                        <a
                          href={item.url}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 flex items-center justify-center gap-1 rounded-lg border border-gray-300 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          ↓ 이미지 다운로드
                        </a>
                      </div>
                    )}

                    {item.type === "video" && item.url && (
                      <div>
                        <video
                          src={item.url}
                          controls
                          className="w-full rounded-lg max-h-64"
                        />
                        <a
                          href={item.url}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 flex items-center justify-center gap-1 rounded-lg border border-gray-300 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          ↓ 영상 다운로드
                        </a>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfessorSubmissions;
