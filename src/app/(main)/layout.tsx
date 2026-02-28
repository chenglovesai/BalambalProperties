import { LandingNav } from "@/components/landing-nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <main>{children}</main>
    </div>
  );
}
