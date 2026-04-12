#!/usr/bin/env python3
"""
Rebuild the TEAMS CMS chunk with Cognis Group team members.

Teams has no indexes file (404 on CDN), only a chunk. We apply
length-prefixed string substitutions via rewrite_bytes (same as
rebuild_services.py) and rewrite image URL blobs.
"""
import pathlib
from rebuild_services import rewrite_bytes
from rewrite_json_blobs import rewrite_image_blobs

RAW_CHUNK = pathlib.Path("framer-cms-raw/nrURXlajq-chunk-default-0.framercms")
OUT_CHUNK = pathlib.Path("cognis-cms/teams-chunk.framercms")

TEAMS = {
    # --- Member 1: Zaire Dorwart → Supreme Oyewumi ---
    "Zaire Dorwart": "Supreme Oyewumi",
    "zaire-dorwart": "supreme-oyewumi",
    "CEO & Founder": "Founder & CEO",
    "Zaire is the CEO and Founder of our agency. With more than 20 years of experience in the Consulting, He started this company with a vision: to make business simple, transparent, and truly centered around people.":
        "Supreme is the Founder and CEO of Cognis Group. He leads the firm\u2019s vision to transform how African enterprises adopt and operationalise artificial intelligence \u2014 from strategy through to production deployment.",
    "@zairedorwart": "@supremeoyewumi",

    # --- Member 2: Cheyenne George → Kola Olatunde ---
    "Cheyenne George": "Kola Olatunde",
    "cheyenne-george": "kola-olatunde",
    "Head of AI Strategy": "Chief Strategy Officer",
    "Cheyenne leads the development of our client-facing AI roadmaps and integration projects. Her expertise in Machine Learning ensures our solutions drive measurable impact and future-proof client operations.":
        "Kola leads strategic advisory engagements, guiding executive teams through AI readiness assessments, use-case prioritisation, and roadmap design. His frameworks have shaped AI adoption at organisations across three continents.",
    "@cheyennegeorge": "@kolaolatunde",

    # --- Member 3: Jaylon Calzoni → Fisayo Oludare ---
    "Jaylon Calzoni": "Fisayo Oludare",
    "jaylon-calzoni": "fisayo-oludare",
    "VP of Business Transformation": "Chief Technology Officer",
    "Jaylon specializes in organizational restructuring and operational efficiency. He uses data-driven insights to help companies optimize workflows and achieve scalable growth beyond technological implementation.":
        "Fisayo architects and delivers production AI systems \u2014 from intelligent agents and automation workflows to data infrastructure. He ensures every engagement ships technology that works in the real world, not just in demos.",
    "@jayloncalzoni": "@fisayooludare",

    # --- Member 4: Erin Siphron → Eugene Jack ---
    "Erin Siphron": "Eugene Jack",
    "erin-siphron": "eugene-jack",
    "Chief Data Scientist": "Head of Agent Engineering",
    "Erin is responsible for designing the robust data architecture and predictive models that power our Data & Insights service. She transforms complex raw data into clear, actionable intelligence.":
        "Eugene designs and builds the AI agents and automation workflows that power Cognis client engagements. From document extraction to customer operations, he ships agent systems that measurably reduce manual effort.",
    "@erinsiphron": "@eugenejack",
}


def main():
    raw = RAW_CHUNK.read_bytes()
    print(f"teams chunk: {len(raw)} bytes")

    data = rewrite_bytes(raw, TEAMS)
    data = rewrite_image_blobs(data)

    OUT_CHUNK.parent.mkdir(parents=True, exist_ok=True)
    OUT_CHUNK.write_bytes(data)
    print(f"wrote {OUT_CHUNK}: {len(raw)} -> {len(data)} bytes ({len(data)-len(raw):+d})")


if __name__ == "__main__":
    main()
