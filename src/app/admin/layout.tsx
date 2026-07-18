import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ops · Tripwaley",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#12100d] text-white">{children}</div>;
}
