import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../shared/api";
import { Assignment } from "../lectures/types";

const SUBMIT_TYPE_OPTIONS = ["text", "image", "video"];

interface ProfessorAssignment extends Assignment {
  submission_count: number;
}

interface WeekGroup {
  week: number;
  topic: string;
  items: ProfessorAssignment[];
}

// ISO → datetime-local input 값 (YYYY-MM-DDTHH:MM)
function toInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// datetime-local 값 → ISO 문자열 (빈 문자열이면 null)
function toISO(val: string): string | null {
  if (!val) return null;
  return new Date(val).toISOString();
}

function ProfessorLectureDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [weeks, setWeeks] = useState<ProfessorAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [openWeek, setOpenWeek] = useState<number | null>(null);
  const [editTypes, setEditTypes] = useState<Record<number, string[]>>({});
  const [editOpenDate, setEditOpenDate] = useState<Record<number, string>>({});
  const [editDueDate, setEditDueDate] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [saved, setSaved] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!id) return;
    api
      .get(`/api/professor/lectures/${id}/assignments`)
      .then((res) => {
        setWeeks(res.data);
        const initialTypes: Record<number, string[]> = {};
        const initialOpen: Record<number, string> = {};
        const initialDue: Record<number, string> = {};
        res.data.forEach((a: ProfessorAssignment) => {
          if (Array.isArray(a.submit_types)) {
            initialTypes[a.id] = a.submit_types;
          } else if (typeof a.submit_types === "string") {
            try {
              const parsed = JSON.parse(a.submit_types);
              initialTypes[a.id] = Array.isArray(parsed) ? parsed : [];
            } catch {
              initialTypes[a.id] = [];
            }
          } else {
            initialTypes[a.id] = [];
          }
          initialOpen[a.id] = toInputValue(a.open_date);
          initialDue[a.id] = toInputValue(a.due_date);
        });
        setEditTypes(initialTypes);
        setEditOpenDate(initialOpen);
        setEditDueDate(initialDue);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const grouped: WeekGroup[] = weeks.reduce<WeekGroup[]>((acc, item: ProfessorAssignment) => {
    const existing = acc.find((g) => g.week === item.week);
    if (existing) {
      existing.items.push(item);
    } else {
      acc.push({ week: item.week, topic: item.topic, items: [item] });
    }
    return acc;
  }, []);

  const toggleType = (assignmentId: number, type: string) => {
    setEditTypes((prev) => {
      const current = prev[assignmentId] ?? [];
      const next = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      return { ...prev, [assignmentId]: next };
    });
    setSaved((prev) => ({ ...prev, [assignmentId]: false }));
  };

  const handleSave = async (item: Assignment) => {
    setSaving(item.id);
    try {
      await api.put(`/api/professor/lectures/${id}/assignments/${item.id}`, {
        week: item.week,
        topic: item.topic,
        week_order: item.week_order,
        video_title: item.video_title,
        practice_content: item.practice_content,
        main_content: item.main_content,
        submit_types: editTypes[item.id] ?? [],
        open_date: toISO(editOpenDate[item.id] ?? ""),
        due_date: toISO(editDueDate[item.id] ?? ""),
      });
      setSaved((prev) => ({ ...prev, [item.id]: true }));
    } catch {
      // TODO: 에러 처리
    } finally {
      setSaving(null);
    }
  };

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
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            onClick={() => navigate("/professor/lectures")}
            className="text-gray-400 hover:text-gray-600"
          >
            ← 목록
          </button>
          <h1 className="text-lg font-bold text-gray-800">과제 관리</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-3">
        {grouped.length === 0 && (
          <div className="py-20 text-center text-gray-400">등록된 주차 정보가 없습니다.</div>
        )}

        {grouped.map((group) => {
          const isOpen = openWeek === group.week;
          const isExam = group.topic.includes("중간고사") || group.topic.includes("기말고사");

          return (
            <div key={group.week} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <button
                onClick={() => setOpenWeek(isOpen ? null : group.week)}
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold
                    ${isExam ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                    {group.week}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{group.week}주차</p>
                    <p className="text-xs text-gray-400">{group.topic}</p>
                  </div>
                </div>
                <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 divide-y divide-gray-100">
                  {group.items.map((item) => {
                    const types = editTypes[item.id] ?? [];
                    const isSaving = saving === item.id;
                    const isSaved = saved[item.id];

                    return (
                      <div key={item.id} className="px-5 py-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">{item.week}주차 {item.week_order}번</p>
                            <p className="text-sm font-medium text-gray-800">{item.video_title || "(제목 없음)"}</p>
                          </div>
                          {!isExam && (
                            <button
                              onClick={() => navigate(`/professor/lectures/${id}/assignments/${item.id}/submissions`)}
                              className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                            >
                              제출 현황
                              {item.submission_count > 0 && (
                                <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-600">
                                  {item.submission_count}
                                </span>
                              )}
                            </button>
                          )}
                        </div>

                        {isExam ? (
                          <p className="text-xs text-gray-400">시험 주차 - 제출 없음</p>
                        ) : (
                          <>
                            {/* 제출 형식 */}
                            <div>
                              <p className="mb-1.5 text-xs font-medium text-gray-500">제출 형식</p>
                              <div className="flex gap-2">
                                {SUBMIT_TYPE_OPTIONS.map((type) => (
                                  <button
                                    key={type}
                                    onClick={() => {
                                      toggleType(item.id, type);
                                      setSaved((prev) => ({ ...prev, [item.id]: false }));
                                    }}
                                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors
                                      ${types.includes(type)
                                        ? "border-blue-500 bg-blue-500 text-white"
                                        : "border-gray-300 text-gray-500 hover:border-gray-400"
                                      }`}
                                  >
                                    {type === "text" ? "텍스트" : type === "image" ? "이미지" : "영상"}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* 날짜 설정 */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">공개 날짜</label>
                                <input
                                  type="datetime-local"
                                  value={editOpenDate[item.id] ?? ""}
                                  onChange={(e) => {
                                    setEditOpenDate((prev) => ({ ...prev, [item.id]: e.target.value }));
                                    setSaved((prev) => ({ ...prev, [item.id]: false }));
                                  }}
                                  className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">마감 날짜</label>
                                <input
                                  type="datetime-local"
                                  value={editDueDate[item.id] ?? ""}
                                  onChange={(e) => {
                                    setEditDueDate((prev) => ({ ...prev, [item.id]: e.target.value }));
                                    setSaved((prev) => ({ ...prev, [item.id]: false }));
                                  }}
                                  className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* 저장 버튼 */}
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleSave(item)}
                                disabled={isSaving || types.length === 0}
                                className="rounded-lg bg-green-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
                              >
                                {isSaving ? "저장 중..." : isSaved ? "저장됨 ✓" : "저장"}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}

export default ProfessorLectureDetail;
