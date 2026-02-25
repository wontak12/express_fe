import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../shared/api";

interface AssignmentSeedItem {
  week: number;
  topic: string;
  week_order: number;
  video_title?: string;
  practice_content?: string;
  main_content?: string;
  submit_types?: string;
  open_date?: string | null;
  due_date?: string | null;
}

interface LectureForm {
  title: string;
  description: string;
  year: number;
  semester: number;
  major: string;
}

function ProfessorCreateLecture() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<LectureForm>({
    title: "",
    description: "",
    year: new Date().getFullYear(),
    semester: 1,
    major: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [lectureId, setLectureId] = useState<number | null>(null);
  const [accessCode, setAccessCode] = useState<string>("");

  const [assignments, setAssignments] = useState<AssignmentSeedItem[]>([]);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const handleFormChange = (field: keyof LectureForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError(null);
  };

  const handleCreateLecture = async () => {
    if (!form.title.trim()) return setFormError("강의명을 입력해주세요.");
    if (!form.major.trim()) return setFormError("전공/구분을 입력해주세요.");

    setCreating(true);
    setFormError(null);
    try {
      const res = await api.post("/api/professor/lectures", {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        year: form.year,
        semester: form.semester,
        major: form.major.trim(),
      });
      setLectureId(res.data.lectureId);
      setAccessCode(res.data.access_code);
      setStep(2);
    } catch {
      setFormError("강의 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setCreating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setJsonError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!Array.isArray(parsed)) {
          setJsonError("JSON 파일은 배열 형식이어야 합니다.");
          setAssignments([]);
          return;
        }
        setAssignments(parsed);
      } catch {
        setJsonError("JSON 파싱에 실패했습니다. 파일을 확인해주세요.");
        setAssignments([]);
      }
    };
    reader.readAsText(file);
  };

  const handleBulkRegister = async () => {
    if (!lectureId || assignments.length === 0) return;

    setBulkLoading(true);
    setJsonError(null);
    try {
      await api.post(`/api/professor/lectures/${lectureId}/assignments/bulk`, assignments);
      navigate("/professor/lectures");
    } catch {
      setJsonError("과제 등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setBulkLoading(false);
    }
  };

  const weekSummary = assignments.reduce<Record<number, { topic: string; count: number }>>((acc, a) => {
    if (!acc[a.week]) acc[a.week] = { topic: a.topic, count: 0 };
    acc[a.week].count += 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          {step === 1 && (
            <button
              onClick={() => navigate("/professor/lectures")}
              className="text-gray-400 hover:text-gray-600"
            >
              ← 목록
            </button>
          )}
          <h1 className="text-lg font-bold text-gray-800">강의 생성</h1>
        </div>
      </header>

      {/* 단계 표시 */}
      <div className="border-b border-gray-100 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step >= 1 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-400"}`}>
              1
            </span>
            <span className={`text-sm font-medium ${step === 1 ? "text-gray-800" : "text-gray-400"}`}>강의 정보</span>
          </div>
          <div className="h-px flex-1 bg-gray-200" />
          <div className="flex items-center gap-1.5">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step >= 2 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-400"}`}>
              2
            </span>
            <span className={`text-sm font-medium ${step === 2 ? "text-gray-800" : "text-gray-400"}`}>과제 등록</span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Step 1: 강의 정보 입력 */}
        {step === 1 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                강의명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleFormChange("title", e.target.value)}
                placeholder="예: 모두의 인공지능"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">강의 설명</label>
              <textarea
                value={form.description}
                onChange={(e) => handleFormChange("description", e.target.value)}
                placeholder="강의에 대한 간단한 설명 (선택사항)"
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  연도 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => handleFormChange("year", Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  학기 <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.semester}
                  onChange={(e) => handleFormChange("semester", Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value={1}>1학기</option>
                  <option value={2}>2학기</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                전공/구분 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.major}
                onChange={(e) => handleFormChange("major", e.target.value)}
                placeholder="예: 교양, 컴퓨터공학과"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {formError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
            )}

            <button
              onClick={handleCreateLecture}
              disabled={creating}
              className="w-full rounded-lg bg-blue-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
            >
              {creating ? "생성 중..." : "강의 생성"}
            </button>
          </div>
        )}

        {/* Step 2: 과제 JSON 등록 */}
        {step === 2 && (
          <div className="space-y-4">
            {/* 생성 완료 정보 */}
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="mb-1 text-sm font-semibold text-green-700">강의가 생성되었습니다</p>
              <p className="text-sm text-green-600">
                참여 코드:{" "}
                <span className="font-mono font-bold tracking-wider">{accessCode}</span>
              </p>
            </div>

            {/* JSON 파일 업로드 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
              <div>
                <p className="mb-1 text-sm font-medium text-gray-700">과제 JSON 파일 업로드</p>
                <p className="text-xs text-gray-400">assignments_seed.json 형식의 파일을 선택하세요.</p>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 px-4 py-8 text-center transition-colors hover:border-blue-400 hover:bg-blue-50"
              >
                {fileName ? (
                  <div>
                    <p className="text-sm font-medium text-blue-600">{fileName}</p>
                    <p className="mt-1 text-xs text-gray-400">클릭하여 다시 선택</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500">클릭하여 파일 선택</p>
                    <p className="mt-1 text-xs text-gray-400">.json 파일</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* 파싱 결과 미리보기 */}
              {assignments.length > 0 && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="mb-3 text-sm font-medium text-gray-700">
                    총 <span className="text-blue-600">{assignments.length}개</span> 과제 ({Object.keys(weekSummary).length}주차)
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {Object.entries(weekSummary)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([week, info]) => (
                        <div key={week} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">
                            <span className="font-medium">{week}주차</span> · {info.topic}
                          </span>
                          <span className="text-gray-400">{info.count}개</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {jsonError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{jsonError}</p>
              )}

              <button
                onClick={handleBulkRegister}
                disabled={bulkLoading || assignments.length === 0}
                className="w-full rounded-lg bg-blue-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
              >
                {bulkLoading ? "등록 중..." : assignments.length > 0 ? `과제 ${assignments.length}개 등록하고 완료` : "JSON 파일을 먼저 선택하세요"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ProfessorCreateLecture;
