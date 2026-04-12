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

RAW_CHUNK = pathlib.Path("cms-raw/nrURXlajq-chunk-default-0.framercms")
OUT_CHUNK = pathlib.Path("cognis-cms/teams-chunk.framercms")

TEAMS = {
    # --- Member 1: Zaire Dorwart → Supreme Oyewumi ---
    "Zaire Dorwart": "Supreme Oyewumi",
    "zaire-dorwart": "supreme-oyewumi",
    "CEO & Founder": "Principal AI Engineer",
    "Zaire is the CEO and Founder of our agency. With more than 20 years of experience in the Consulting, He started this company with a vision: to make business simple, transparent, and truly centered around people.":
        "Supreme co-founded Cognis Group and leads its AI engineering practice \u2014 architecting, building, and deploying the intelligent agents, automation systems, and ML pipelines that power client engagements. He turns strategy into working production software.",
    "@zairedorwart": "@supremeoyewumi",

    # --- Member 2: Cheyenne George → Kola Olatunde ---
    "Cheyenne George": "Kola Olatunde",
    "cheyenne-george": "kola-olatunde",
    "Head of AI Strategy": "AI Cybersecurity & Governance Lead",
    "Cheyenne leads the development of our client-facing AI roadmaps and integration projects. Her expertise in Machine Learning ensures our solutions drive measurable impact and future-proof client operations.":
        "Kola co-founded Cognis Group and leads its cybersecurity and AI governance practice \u2014 designing policy frameworks, model oversight systems, and compliance architectures aligned to the EU AI Act, ISO 42001, NIST AI RMF, and the Nigerian Data Protection Act. He has secured AI deployments for financial, government, and enterprise clients across three continents.",
    "@cheyennegeorge": "@kolaolatunde",

    # --- Member 3: Jaylon Calzoni → Fisayo Oludare ---
    "Jaylon Calzoni": "Fisayo Oludare",
    "jaylon-calzoni": "fisayo-oludare",
    "VP of Business Transformation": "Executive Director, Partnerships & AI Enablement",
    "Jaylon specializes in organizational restructuring and operational efficiency. He uses data-driven insights to help companies optimize workflows and achieve scalable growth beyond technological implementation.":
        "Fisayo leads strategic partnerships and client growth at Cognis Group \u2014 opening doors with enterprises, government, and ecosystem partners. He also works hands-on with clients to adopt AI effectively, translating capability into practical use and training teams to get real value from it.",
    "@jayloncalzoni": "@fisayooludare",

    # --- Member 4: Erin Siphron → Eugene Jack ---
    "Erin Siphron": "Eugene Jack",
    "erin-siphron": "eugene-jack",
    "Chief Data Scientist": "Head of Agent Engineering",
    "Erin is responsible for designing the robust data architecture and predictive models that power our AI Agent & Automation Engineering service. She transforms complex raw data into clear, actionable intelligence.":
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
