"use client";

import { useState } from "react";
import { MapPin, Maximize2, Minimize2, Navigation, Train } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LocationMapProps {
  latitude: number;
  longitude: number;
  address: string;
  district: string;
  mtrStation: string | null;
  mtrProximity: string | null;
}

export function LocationMap({
  latitude,
  longitude,
  address,
  district,
  mtrStation,
  mtrProximity,
}: LocationMapProps) {
  const [expanded, setExpanded] = useState(false);

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.005},${latitude - 0.003},${longitude + 0.005},${latitude + 0.003}&layer=mapnik&marker=${latitude},${longitude}`;
  const fullMapUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  return (
    <Card className="bg-white overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5 text-primary" />
            Location
          </CardTitle>
          <div className="flex gap-2">
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <Navigation className="h-3.5 w-3.5" />
                Directions
              </Button>
            </a>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
              {expanded ? "Collapse" : "Expand"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          className={`relative w-full transition-all duration-300 ${
            expanded ? "h-[400px]" : "h-[200px]"
          }`}
        >
          <iframe
            src={mapUrl}
            className="h-full w-full border-0"
            loading="lazy"
            title={`Map showing ${address}`}
          />
        </div>
        <div className="p-4 space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">{address}, {district}</span>
          </div>
          {mtrStation && (
            <div className="flex items-center gap-2 text-sm">
              <Train className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">
                {mtrStation} MTR
                {mtrProximity && <span className="text-foreground font-medium"> — {mtrProximity}</span>}
              </span>
            </div>
          )}
          <a
            href={fullMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View larger map
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
