"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, Layers, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "All",
  "Private Office",
  "Open Space",
  "Studio",
  "Enterprise Suite",
];

interface Property {
  id: string;
  title: string;
  district: string;
  address: string;
  propertyType: string;
  monthlyRent: number | null;
  price: number | null;
  saleableArea: number | null;
  grossArea: number | null;
  images: string[];
  floor: string | null;
  verificationScore: number;
}

interface FeaturedPropertiesProps {
  properties: Property[];
}

export function FeaturedProperties({ properties }: FeaturedPropertiesProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [page, setPage] = useState(0);

  const perPage = 3;
  const maxPage = Math.max(0, Math.ceil(properties.length / perPage) - 1);
  const visible = properties.slice(page * perPage, page * perPage + perPage);

  if (properties.length === 0) return null;

  return (
    <section className="bg-[#f5f5f7]">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-black">
              Featured Properties
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Discover AI-powered selections
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 transition-colors hover:text-black disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(maxPage, page + 1))}
                disabled={page >= maxPage}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 transition-colors hover:text-black disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <Link
              href="/search?view=results"
              className="text-sm font-medium text-[#1e1b4b] hover:underline"
            >
              View all listings
            </Link>
          </div>
        </div>

        {/* Category pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-medium transition-colors",
                activeCategory === cat
                  ? "bg-[#1e1b4b] text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Property cards */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((property) => (
            <div
              key={property.id}
              className="overflow-hidden rounded-xl bg-white shadow-sm"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <Image
                  src={
                    property.images[0] ||
                    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400"
                  }
                  alt={property.title}
                  width={400}
                  height={300}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-black truncate">
                      {property.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-400 truncate">
                      {property.address}, {property.district}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {property.monthlyRent ? (
                      <>
                        <p className="text-lg font-bold text-[#1e1b4b]">
                          ${(property.monthlyRent / 1000).toFixed(0)}K
                        </p>
                        <p className="text-[11px] text-gray-400">/month</p>
                      </>
                    ) : property.price ? (
                      <>
                        <p className="text-lg font-bold text-[#1e1b4b]">
                          ${property.price >= 1_000_000 ? `${(property.price / 1_000_000).toFixed(1)}M` : `${(property.price / 1000).toFixed(0)}K`}
                        </p>
                        <p className="text-[11px] text-gray-400">sale</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400">Enquire</p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
                  {(property.saleableArea || property.grossArea) && (
                    <span className="flex items-center gap-1">
                      <Maximize2 className="h-3.5 w-3.5" />
                      {(property.saleableArea || property.grossArea)!.toLocaleString()}sqft
                    </span>
                  )}
                  {property.floor && (
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" />
                      {property.floor}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" />
                    Grade {property.verificationScore >= 60 ? "A" : "B"}
                  </span>
                </div>

                <Link
                  href={`/property/${property.id}`}
                  className="mt-4 flex w-full items-center justify-center rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
