import { useState, useRef, useEffect, KeyboardEvent } from "react";
import api from "../api";

const CODE_LENGTH = 6;

interface JoinModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function JoinModal({ onClose, onSuccess }: JoinModalProps) {
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError("");
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    const newCode = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((ch, i) => { newCode[i] = ch; });
    setCode(newCode);
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  };

  const handleSubmit = async () => {
    const fullCode = code.join("");
    if (fullCode.length < CODE_LENGTH) {
      setError("인증번호 6자리를 모두 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/api/lectures/enroll", { access_code: fullCode });
      setSuccess(true);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setError("유효하지 않은 인증번호입니다.");
      } else if (status === 409) {
        setError("이미 참여한 강의입니다.");
      } else {
        setError("오류가 발생했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mb-1 text-xl font-bold text-gray-800">참여 완료!</h2>
            <p className="mb-6 text-sm text-gray-500">강의에 참여했습니다.</p>
            <button
              onClick={handleConfirm}
              className="w-full rounded-lg bg-blue-500 py-2.5 font-medium text-white transition-colors hover:bg-blue-600"
            >
              확인
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-800">강의 참여</h2>
              <p className="mt-1 text-sm text-gray-500">강사에게 받은 6자리 인증번호를 입력하세요.</p>
            </div>

            <div className="mb-2 flex justify-center gap-2">
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitInput(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  className={`h-12 w-12 rounded-lg border-2 text-center text-xl font-bold transition-colors focus:outline-none
                    ${error ? "border-red-400" : digit ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300"}
                    focus:border-blue-500`}
                />
              ))}
            </div>

            {error && (
              <p className="mb-3 text-center text-xs text-red-500">{error}</p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 rounded-lg bg-blue-500 py-2.5 font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? "확인 중..." : "참여하기"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default JoinModal;
