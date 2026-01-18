import { useState, FormEvent, ChangeEvent } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Login:", { email, password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">로그인</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">이메일</label>
            <input type="email" value={email} onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} placeholder="이메일을 입력하세요" className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">비밀번호</label>
            <input type="password" value={password} onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} placeholder="비밀번호를 입력하세요" className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none" />
          </div>
          <button type="submit" className="w-full rounded-md bg-blue-500 py-2 font-medium text-white hover:bg-blue-600">로그인</button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          계정이 없으신가요? <a href="#" className="text-blue-500 hover:underline">회원가입</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
