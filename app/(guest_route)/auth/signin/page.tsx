"use client";
// pages/auth/login.js
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result && !result.error) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Đăng nhập</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-600">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-600">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Đăng nhập
          </button>
        </form>
        <div className="mt-4">
          <button
            onClick={() => signIn("google")}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Đăng nhập bằng Google
          </button>
          <button
            onClick={() => signIn("github")}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 ml-2"
          >
            Đăng nhập bằng GitHub
          </button>
        </div>
        <p className="mt-4 text-gray-600">
          Bạn chưa có tài khoản?{" "}
          <Link href="/auth/register">
            <b className="text-blue-500 hover:underline">Đăng ký ngay</b>
          </Link>
        </p>
      </div>
    </div>
  );
}
