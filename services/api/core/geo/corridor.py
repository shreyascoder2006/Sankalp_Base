from dataclasses import dataclass


@dataclass(frozen=True)
class BBox:
    south: float
    west: float
    north: float
    east: float

    def tiles(self, step: float) -> list["BBox"]:
        out = []
        lat = self.south
        while lat < self.north:
            lon = self.west
            while lon < self.east:
                out.append(
                    BBox(lat, lon, min(lat + step, self.north), min(lon + step, self.east))
                )
                lon += step
            lat += step
        return out

    def as_overpass(self) -> str:
        return f"{self.south},{self.west},{self.north},{self.east}"


@dataclass(frozen=True)
class Anchor:
    key: str
    name: str
    lon: float
    lat: float


@dataclass(frozen=True)
class Corridor:
    key: str
    name: str
    bbox: BBox
    origin: Anchor
    destination: Anchor


# Coordinates verified against OSM place nodes; APMC is the Panchavati market yard.
NASHIK = Corridor(
    key="nashik",
    name="Pimpalgaon Baswant to Nashik APMC",
    bbox=BBox(south=19.98, west=73.75, north=20.25, east=74.10),
    origin=Anchor("pimpalgaon", "Pimpalgaon Basvant", 73.99262, 20.16876),
    destination=Anchor("nashik_apmc", "Nashik APMC", 73.79000, 20.02000),
)

CORRIDORS = {c.key: c for c in (NASHIK,)}
