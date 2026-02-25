import { useNavigate } from "react-router-dom";
import { Lecture } from "../../features/lectures/types";

interface LectureCardProps {
  lecture: Lecture;
}

function LectureCard({ lecture }: LectureCardProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3">
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
          {lecture.major}
        </span>
      </div>

      <h3 className="mb-1 text-base font-bold text-gray-800">{lecture.title}</h3>
      <p className="mb-3 text-sm text-gray-400">{lecture.description}</p>

      <div className="mb-4 mt-auto space-y-1">
        <p className="text-sm text-gray-500">교수: {lecture.professor}</p>
        <p className="text-sm text-gray-500">{lecture.year}년 {lecture.semester}학기</p>
      </div>

      <button
        onClick={() => navigate(`/lectures/${lecture.id}`, { state: { lecture } })}
        className="w-full rounded-lg bg-green-500 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
      >
        과제 제출
      </button>
    </div>
  );
}

export default LectureCard;
