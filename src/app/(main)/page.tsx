export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { LandingSearchCard } from "@/components/landing-search-card";
import { prisma } from "@/lib/prisma";

async function getHotProperties() {
  try {
    return await prisma.property.findMany({
      where: { status: "active" },
      orderBy: [{ engagementScore: "desc" }, { createdAt: "desc" }],
      take: 6,
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const properties = await getHotProperties();

  return (
    <div className="min-h-screen">
      {/* White background */}
      <div className="absolute inset-0 -z-10 bg-white" />

      {/* Main two-column section */}
      <section className="border-b border-black">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 lg:flex-row lg:items-center lg:gap-12 lg:px-8 lg:py-16">
          {/* Left: Hero content */}
          <div className="flex-1 lg:max-w-[60%]">
            <h1 className="text-4xl font-bold tracking-tight text-black sm:text-5xl">
              Work{" "}
              <span className="italic text-[#4f46e5]">Smarter</span>
              <br />
              Find Your Space.
            </h1>
            <p className="mt-6 max-w-lg text-base text-black">
              Discover verified SME office spaces, get expert guidance, and move
              in with ease. Multimodal search powered by AI.
            </p>
            <div className="mt-8">
              <div className="overflow-hidden rounded-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"
                  alt="Modern office space with city view"
                  width={600}
                  height={400}
                  className="h-auto w-full object-cover"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Right: Search card */}
          <div className="flex-shrink-0 lg:w-[420px]">
            <LandingSearchCard />
          </div>
        </div>
      </section>

      {/* White content area - Hot Properties */}
      {properties.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-black">
                Featured Listings
              </h2>
              <p className="mt-1 text-gray-500">
                Verified commercial spaces in Hong Kong
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <Link
                  key={property.id}
                  href={`/property/${property.id}`}
                  className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                    <Image
                      src={
                        property.images[0] ||
                        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400"
                      }
                      alt={property.title}
                      width={400}
                      height={300}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-black line-clamp-1">
                      {property.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {property.district} · {property.address}
                    </p>
                    {property.monthlyRent && (
                      <p className="mt-2 text-lg font-bold text-[#4f46e5]">
                        HK$
                        {property.monthlyRent.toLocaleString()}
                        <span className="text-sm font-normal text-gray-500">
                          /mo
                        </span>
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/search"
                className="inline-flex items-center justify-center rounded-lg bg-[#4f46e5] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#4338ca]"
              >
                View All Listings
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
