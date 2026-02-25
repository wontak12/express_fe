import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../shared/api";
import { Assignment, Lecture } from "./types";

interface WeekGroup {
  week: number;
  topic: string;
  items: Assignment[];
}

type SubmitType = "text" | "image" | "video";

interface SubmitItem {
  id: number;
  type: SubmitType;
  value: string;      // 텍스트 내용 or 파일명(표시용)
  url?: string;       // 업로드 후 받은 url
  uploading?: boolean;
}

function getTypes(raw: string[] | string): SubmitType[] {
  if (Array.isArray(raw)) return raw as SubmitType[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as SubmitType[];
    } catch {
      // ignore
    }
  }
  return [];
}

function formatDueDate(due: string | null): string | null {
  if (!due) return null;
  const d = new Date(due);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function isExpired(due: string | null): boolean {
  if (!due) return false;
  return new Date(due) < new Date();
}

function isNotOpen(open: string | null): boolean {
  if (!open) return false;
  return new Date(open) > new Date();
}

let itemCounter = 0;

function LectureDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const lecture = (location.state as { lecture?: Lecture } | null)?.lecture ?? null;

  const [weeks, setWeeks] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [openWeek, setOpenWeek] = useState<number | null>(null);
  const [activeItem, setActiveItem] = useState<number | null>(null);
  const [submitItems, setSubmitItems] = useState<Record<number, SubmitItem[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [submittedAt, setSubmittedAt] = useState<Record<number, string>>({});

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!id) return;
    api
      .get(`/api/lectures/${id}/assignments`)
      .then((res) => {
        const assignments: Assignment[] = res.data;
        setWeeks(assignments);
        // 각 assignment별 제출 여부 조회
        assignments.forEach((a) => {
          api
            .get(`/api/submissions/${a.id}`)
            .then((r) => {
              setSubmitted((prev) => ({ ...prev, [a.id]: true }));
              setSubmittedAt((prev) => ({ ...prev, [a.id]: r.data.submitted_at ?? "" }));
            })
            .catch(() => {}); // 404 = 미제출, 무시
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const grouped: WeekGroup[] = weeks.reduce<WeekGroup[]>((acc, item) => {
    const existing = acc.find((g) => g.week === item.week);
    if (existing) {
      existing.items.push(item);
    } else {
      acc.push({ week: item.week, topic: item.topic, items: [item] });
    }
    return acc;
  }, []);

  const addSubmitItem = (assignmentId: number, type: SubmitType) => {
    const newItem: SubmitItem = { id: ++itemCounter, type, value: "" };
    setSubmitItems((prev) => ({
      ...prev,
      [assignmentId]: [...(prev[assignmentId] ?? []), newItem],
    }));
  };

  const removeSubmitItem = (assignmentId: number, itemId: number) => {
    setSubmitItems((prev) => ({
      ...prev,
      [assignmentId]: (prev[assignmentId] ?? []).filter((i) => i.id !== itemId),
    }));
  };

  const updateText = (assignmentId: number, itemId: number, value: string) => {
    setSubmitItems((prev) => ({
      ...prev,
      [assignmentId]: (prev[assignmentId] ?? []).map((i) =>
        i.id === itemId ? { ...i, value } : i
      ),
    }));
  };

  const uploadFile = async (assignmentId: number, itemId: number, file: File) => {
    // uploading 상태로 먼저 표시
    setSubmitItems((prev) => ({
      ...prev,
      [assignmentId]: (prev[assignmentId] ?? []).map((i) =>
        i.id === itemId ? { ...i, value: file.name, uploading: true } : i
      ),
    }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { url } = res.data;
      setSubmitItems((prev) => ({
        ...prev,
        [assignmentId]: (prev[assignmentId] ?? []).map((i) =>
          i.id === itemId ? { ...i, url, uploading: false } : i
        ),
      }));
    } catch {
      // 업로드 실패 시 초기화
      setSubmitItems((prev) => ({
        ...prev,
        [assignmentId]: (prev[assignmentId] ?? []).map((i) =>
          i.id === itemId ? { ...i, value: "", uploading: false } : i
        ),
      }));
      alert("파일 업로드에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const canSubmit = (assignmentId: number) => {
    const items = submitItems[assignmentId] ?? [];
    if (items.length === 0) return false;
    return items.every((i) => {
      if (i.uploading) return false;
      if (i.type === "text") return i.value.trim() !== "";
      return !!i.url; // 파일은 url 있어야 함
    });
  };

  const handleSubmit = async (item: Assignment) => {
    const items = submitItems[item.id] ?? [];
    if (!canSubmit(item.id)) return;

    setSubmitting(true);
    try {
      const submitType = items[0].type; // 대표 타입
      const payload = {
        submit_type: submitType,
        items: items.map((si, idx) => ({
          order: idx,
          type: si.type,
          ...(si.type === "text" ? { content: si.value } : { url: si.url }),
        })),
      };

      await api.post(`/api/submissions/${item.id}`, payload);
      setSubmitted((prev) => ({ ...prev, [item.id]: true }));
      setSubmittedAt((prev) => ({ ...prev, [item.id]: new Date().toISOString() }));
      setSubmitItems((prev) => ({ ...prev, [item.id]: [] }));
      setActiveItem(null);
    } catch {
      alert("제출에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
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
            onClick={() => navigate("/lectures")}
            className="text-gray-400 hover:text-gray-600"
          >
            ← 목록
          </button>
          <div>
            {lecture ? (
              <>
                <p className="text-base font-bold text-gray-800">{lecture.title}</p>
                <p className="text-xs text-gray-400">{lecture.professor} · {lecture.year}년 {lecture.semester}학기</p>
              </>
            ) : (
              <p className="text-xs text-gray-400">강의 #{id}</p>
            )}
          </div>
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
                    const isActive = activeItem === item.id;
                    const isDone = submitted[item.id];
                    const doneAt = submittedAt[item.id];
                    const notOpen = isNotOpen(item.open_date);
                    const expired = isExpired(item.due_date);
                    const openDateStr = formatDueDate(item.open_date);
                    const dueDateStr = formatDueDate(item.due_date);
                    const types = getTypes(item.submit_types);
                    const uniqueTypes = [...new Set(types)];
                    const items = submitItems[item.id] ?? [];

                    return (
                      <div key={item.id} className="px-5 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-xs text-gray-400 mb-0.5">{item.week}주차 {item.week_order}번</p>
                            <p className="text-sm font-medium text-gray-800">{item.video_title}</p>
                            {item.practice_content && (
                              <p className="mt-1 text-xs text-blue-600">[실습] {item.practice_content}</p>
                            )}
                            {item.main_content && (
                              <p className="mt-0.5 text-xs text-gray-500">{item.main_content}</p>
                            )}
                            {notOpen && openDateStr && (
                              <p className="mt-1 text-xs font-medium text-gray-400">
                                공개 예정 · {openDateStr}
                              </p>
                            )}
                            {!notOpen && dueDateStr && (
                              <p className={`mt-1 text-xs font-medium ${expired ? "text-red-400" : "text-orange-400"}`}>
                                {expired ? "마감됨" : "마감"} · {dueDateStr}
                              </p>
                            )}
                            {isDone && doneAt && (
                              <p className="mt-1 text-xs text-green-500">
                                제출완료 · {formatDueDate(doneAt)}
                              </p>
                            )}
                          </div>

                          {!isExam && (
                            <button
                              onClick={() => setActiveItem(isActive ? null : item.id)}
                              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
                                ${notOpen || expired
                                  ? "bg-gray-100 text-gray-400 cursor-default"
                                  : isActive
                                  ? "bg-gray-100 text-gray-600"
                                  : isDone
                                  ? "bg-orange-400 text-white hover:bg-orange-500"
                                  : "bg-green-500 text-white hover:bg-green-600"
                                }`}
                              disabled={notOpen || expired}
                            >
                              {notOpen ? "공개 전" : expired ? "마감됨" : isActive ? "닫기" : isDone ? "재제출" : "과제 제출"}
                            </button>
                          )}
                        </div>

                        {/* 과제 제출 폼 */}
                        {isActive && (
                          <div className="mt-4 space-y-3">
                            {isDone && (
                              <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2">
                                <p className="text-xs text-orange-600 font-medium">재제출 시 기존 제출물이 삭제되고 새 내용으로 교체됩니다.</p>
                              </div>
                            )}
                            {/* 추가된 제출 항목들 */}
                            {items.map((si, idx) => (
                              <div key={si.id} className="rounded-lg border border-gray-200 p-3">
                                <div className="mb-2 flex items-center justify-between">
                                  <span className="text-xs font-medium text-gray-500">
                                    {si.type === "text" && "텍스트"}
                                    {si.type === "image" && "이미지"}
                                    {si.type === "video" && "영상"}
                                    {" "}#{idx + 1}
                                  </span>
                                  <button
                                    onClick={() => removeSubmitItem(item.id, si.id)}
                                    className="text-xs text-gray-400 hover:text-red-400"
                                  >
                                    삭제
                                  </button>
                                </div>

                                {si.type === "text" && (
                                  <textarea
                                    rows={3}
                                    value={si.value}
                                    onChange={(e) => updateText(item.id, si.id, e.target.value)}
                                    placeholder="내용을 입력하세요"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                                  />
                                )}

                                {(si.type === "image" || si.type === "video") && (
                                  <div>
                                    <input
                                      type="file"
                                      accept={si.type === "image" ? "image/*" : "video/*"}
                                      className="hidden"
                                      ref={(el) => { fileInputRefs.current[`${item.id}-${si.id}`] = el; }}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) uploadFile(item.id, si.id, file);
                                      }}
                                    />
                                    <button
                                      onClick={() => fileInputRefs.current[`${item.id}-${si.id}`]?.click()}
                                      disabled={si.uploading}
                                      className="w-full rounded-lg border-2 border-dashed border-gray-300 py-4 text-sm text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors disabled:opacity-50"
                                    >
                                      {si.uploading ? (
                                        <span className="text-blue-400">업로드 중...</span>
                                      ) : si.url ? (
                                        <span className="text-green-600">✓ {si.value}</span>
                                      ) : (
                                        `클릭해서 ${si.type === "image" ? "이미지" : "영상"} 선택`
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}

                            {/* 타입별 추가 버튼 */}
                            {uniqueTypes.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {uniqueTypes.map((type) => (
                                  <button
                                    key={type}
                                    onClick={() => addSubmitItem(item.id, type)}
                                    className="rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
                                  >
                                    + {type === "text" ? "텍스트" : type === "image" ? "이미지" : "영상"} 추가
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* 제출 버튼 */}
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setActiveItem(null)}
                                className="rounded-lg border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                              >
                                취소
                              </button>
                              <button
                                onClick={() => handleSubmit(item)}
                                disabled={submitting || !canSubmit(item.id)}
                                className="rounded-lg bg-blue-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50"
                              >
                                {submitting ? "제출 중..." : "제출하기"}
                              </button>
                            </div>
                          </div>
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

export default LectureDetail;
