import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-lg font-semibold">Page not found</h2>
      <Button asChild variant="outline">
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    </div>
  );
}
