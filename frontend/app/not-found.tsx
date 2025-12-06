import Link from "next/link";

export default function NotFound() {
  return (
    <div className="h-[100vh] center flex-col">
      <h1 className="font-bold text-4xl py-4">404 - Page Not Found</h1>
      <p>Sorry, the page you are looking for does not exist.</p>
      <Link href="/" className="bg-gray-300 p-2 px-4 rounded-[20px] my-4">
        - Go back home
      </Link>
    </div>
  );
}
