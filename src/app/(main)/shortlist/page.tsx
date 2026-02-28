export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  Search,
  MapPin,
  Ruler,
  Building,
  Star,
  Sparkles,
  Phone,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatArea } from "@/lib/utils";
import { ShortlistButton } from "@/components/shortlist-button";

const typeLabels: Record<string, string> = {
  retail: "Retail",
  fnb: "F&B",
  office: "Office",
  warehouse: "Warehouse",
  industrial: "Industrial",
};

const gradeInfo: Record<string, { color: string; desc: string }> = {
  A: { color: "bg-emerald-100 text-emerald-700", desc: "Premium" },
  B: { color: "bg-blue-100 text-blue-700", desc: "Good Quality" },
  C: { color: "bg-amber-100 text-amber-700", desc: "Budget-Friendly" },
};

function generateSummary(property: {
  title: string;
  district: string;
  propertyType: string;
  monthlyRent: number | null;
  saleableArea: number | null;
  buildingGrade: string | null;
  mtrProximity: string | null;
  features: unknown;
  aiScore: number | null;
}) {
  const benefits: string[] = [];
  const tradeoffs: string[] = [];
  const unknowns: string[] = [];

  if (property.buildingGrade === "A") benefits.push("Premium Grade A building with top-tier facilities");
  if (property.mtrProximity?.includes("min")) benefits.push(`Convenient MTR access (${property.mtrProximity})`);
  if (property.aiScore && property.aiScore > 70) benefits.push(`High AI match score of ${property.aiScore}/100`);
  if (property.saleableArea && property.saleableArea > 1000) benefits.push("Generous floor area for operations");
  if (benefits.length === 0) benefits.push("Competitive pricing for the area");

  if (property.monthlyRent && property.monthlyRent > 100000) tradeoffs.push("Higher monthly cost commitment");
  if (property.buildingGrade === "C") tradeoffs.push("Basic building amenities and finishes");
  if (!property.mtrProximity?.includes("min")) tradeoffs.push("May require additional transport arrangements");
  if (tradeoffs.length === 0) tradeoffs.push("Limited parking options in the area");

  unknowns.push("Exact fit-out condition and renovation needs");
  unknowns.push("Building management flexibility on signage and operations");

  return { benefits, tradeoffs, unknowns };
}

async function getShortlist(userId: string) {
  try {
    return await prisma.shortlist.findMany({
      where: { userId },
      include: { property: true },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export default async function ShortlistPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const shortlists = await getShortlist(session.user.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Heart className="h-6 w-6 text-red-500" />
            My Shortlist
          </h1>
          <p className="mt-1 text-gray-500">
            {shortlists.length} saved {shortlists.length === 1 ? "property" : "properties"}
          </p>
        </div>
        {shortlists.length >= 2 && (
          <Link
            href="/compare"
            className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            Compare Properties
          </Link>
        )}
      </div>

      {shortlists.length > 0 ? (
        <div className="space-y-6">
          {shortlists.map((s) => {
            const p = s.property;
            const summary = generateSummary(p);
            const grade = p.buildingGrade ? gradeInfo[p.buildingGrade] : null;
            const imageUrl = p.images[0] || "/placeholder-property.svg";

            return (
              <div
                key={s.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Image */}
                  <Link href={`/property/${p.id}`} className="lg:w-80 flex-shrink-0">
                    <div className="relative h-48 lg:h-full overflow-hidden bg-gray-100">
                      <img
                        src={imageUrl}
                        alt={p.title}
                        className="h-full w-full object-cover"
                      />
                      {p.aiScore && (
                        <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-black/80 px-2 py-1 text-xs font-medium text-amber-400 backdrop-blur">
                          <Sparkles className="h-3 w-3" />
                          {p.aiScore}/100
                        </div>
                      )}
                      {grade && (
                        <div className={`absolute top-3 right-3 rounded-full px-2 py-0.5 text-xs font-semibold ${grade.color}`}>
                          Grade {p.buildingGrade}
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/property/${p.id}`} className="hover:underline">
                          <h3 className="text-lg font-semibold">{p.title}</h3>
                        </Link>
                        <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {p.district}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building className="h-3.5 w-3.5" />
                            {typeLabels[p.propertyType] || p.propertyType}
                          </span>
                          {p.saleableArea && (
                            <span className="flex items-center gap-1">
                              <Ruler className="h-3.5 w-3.5" />
                              {formatArea(p.saleableArea)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShortlistButton propertyId={p.id} />
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mt-3 flex items-baseline gap-2">
                      {p.monthlyRent && (
                        <span className="text-xl font-bold text-black">
                          {formatCurrency(p.monthlyRent)}
                          <span className="text-sm font-normal text-gray-500">/mo</span>
                        </span>
                      )}
                      {p.agentName && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Phone className="h-3 w-3" />
                          {p.agentName}
                        </span>
                      )}
                    </div>

                    {/* AI Summary */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="rounded-lg bg-emerald-50 p-3">
                        <div className="font-semibold text-emerald-700 mb-1">Benefits</div>
                        <ul className="space-y-0.5 text-emerald-600">
                          {summary.benefits.map((b, i) => (
                            <li key={i} className="flex gap-1">
                              <Star className="h-3 w-3 flex-shrink-0 mt-0.5" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-amber-50 p-3">
                        <div className="font-semibold text-amber-700 mb-1">Trade-offs</div>
                        <ul className="space-y-0.5 text-amber-600">
                          {summary.tradeoffs.map((t, i) => (
                            <li key={i}>• {t}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-blue-50 p-3">
                        <div className="font-semibold text-blue-700 mb-1">Ask the Agent</div>
                        <ul className="space-y-0.5 text-blue-600">
                          {summary.unknowns.map((u, i) => (
                            <li key={i}>? {u}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-3">
                      <Link
                        href={`/property/${p.id}`}
                        className="flex items-center gap-1 rounded-lg bg-black px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 transition-colors"
                      >
                        View Details <ArrowRight className="h-3 w-3" />
                      </Link>
                      {p.agentPhone && (
                        <a
                          href={`tel:${p.agentPhone}`}
                          className="flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Phone className="h-3 w-3" />
                          Contact Agent
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="h-16 w-16 text-gray-200" />
          <h3 className="mt-4 text-lg font-semibold">No saved properties yet</h3>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            Browse properties and click the heart icon to save them to your shortlist for easy comparison.
          </p>
          <Link
            href="/search"
            className="mt-6 flex items-center gap-2 rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            <Search className="h-4 w-4" />
            Search Properties
          </Link>
        </div>
      )}
    </div>
  );
}
