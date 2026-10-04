# Data sources and what is still missing

## What is real

| Layer | Source | Status |
|---|---|---|
| Road network, routing, detours | Geofabrik `western-zone-latest.osm.pbf`, ODbL | **Real.** 192k directed edges, validated against live OSRM |
| Settlement coordinates | OSM `place` nodes | **Real but sparse** — only 19 settlements mapped on this corridor |
| Landholding distribution | Agriculture Census 2015-16 | **Real**, all-India rather than Nashik-specific |
| Diesel price, CO2 factor | Published | **Real** (diesel is a Mumbai figure; Nashik differs) |

## What is simulated and uncalibrated

Farmer offer rate, marketable lot size, driver trip rate, driver acceptance rate, and
all backhaul demand. Every one is tagged `SIMULATED` in code and surfaced as such in the
UI. They are what Phase 0 field interviews exist to replace.

## Blocker: Agmarknet

The Phase 4 backtest needs observed daily arrivals at Nashik / Pimpalgaon APMC. It could
not be obtained from this environment.

What was tried, 2026-10-03:

1. `agmarknet.gov.in` serves a React SPA; its data arrives over an API, not in the HTML.
2. The bundle names the API base `https://api.agmarknet.gov.in/v1/`. The host resolves
   and answers, but every endpoint path extracted from the bundle returns 404
   (`priceArrivalReport/fetchReport`, `pricearrivalreport/fetchMarkets`,
   `catalogData/fetchCommodityGroups`, and others), including when called from the
   page's own origin — so this is not a CORS problem.
3. The bundle also contains `auth/refresh` with access tokens, so the real endpoints are
   likely behind a prefix or an authenticated gateway not reachable anonymously.
4. Driving the public dashboard's own filter form fired no network request at all, and
   the site repeatedly calls `console.clear()`, which prevents reading its errors.
5. `api.data.gov.in`, which mirrors this dataset, was unreachable from this network.

### What unblocks it

Supply a CSV at `data/raw/arrivals_nashik.csv`:

```
date,arrivals_tonnes
2026-01-01,412.5
```

Then run:

```bash
python scripts/run_backtest.py
```

`run_backtest.py` exits 2 and refuses to produce a fit while that file is absent. There
is deliberately no synthetic fallback — fitting the harvest model to invented arrivals
would validate nothing while producing something that looks like validation.

Until it runs, **the harvest model is uncalibrated**, and every volume, revenue, fill
rate and CO2 figure the simulation reports describes the model's assumptions rather than
the corridor.

## Deliberately not twinned

There is no public feed of rural SCV movement anywhere — FASTag transaction data is not
published and VAHAN covers registration, not motion. Real truck state therefore arrives
only when drivers are onboarded, through the four signals the brief already proposes
(declared trips, WhatsApp live location, mandi geofence, missed-call tower logs).
`twin/engine/sources.py` is built to accept them without the matching engine changing.

Backhaul demand has no public dataset at any tier and stays simulated until real input
dealers and kiranas are signed.
