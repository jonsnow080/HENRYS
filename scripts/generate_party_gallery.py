from __future__ import annotations

from pathlib import Path
from textwrap import dedent

OUTPUT_DIR = Path(__file__).resolve().parents[1] / "public" / "images" / "event-gallery"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

SCENES = [
    {
        "filename": "beach-bonfire-celebration.svg",
        "title": "Moonlit beach bonfire",
        "gradient": ("#0f1235", "#f89b4c"),
        "horizon": "#fce5c3",
        "people": [
            {"body": "#f0748d", "accent": "#ffd6cc"},
            {"body": "#4fbecf", "accent": "#f6f0ff"},
            {"body": "#f5a05c", "accent": "#ffe9cf"},
        ],
        "details": ["bonfire", "palm", "stars"],
    },
    {
        "filename": "sunset-yacht-party.svg",
        "title": "Sunset yacht celebration",
        "gradient": ("#09203f", "#ff8f70"),
        "horizon": "#ffd2a8",
        "people": [
            {"body": "#f05b6d", "accent": "#ffd7dd"},
            {"body": "#5cc6c9", "accent": "#f2f9ff"},
            {"body": "#f7c45a", "accent": "#fff1c2"},
        ],
        "details": ["boat", "waves", "sun"],
    },
    {
        "filename": "garden-dinner-party.svg",
        "title": "Garden dinner gathering",
        "gradient": ("#102523", "#f0a66f"),
        "horizon": "#f6e1c8",
        "people": [
            {"body": "#f06786", "accent": "#ffd6e0"},
            {"body": "#5db0d7", "accent": "#f4fbff"},
            {"body": "#f2c85c", "accent": "#fff2c3"},
        ],
        "details": ["table", "lanterns", "foliage"],
    },
    {
        "filename": "speakeasy-cocktails.svg",
        "title": "Speakeasy cocktail hour",
        "gradient": ("#120c1d", "#f47583"),
        "horizon": "#f9d3c4",
        "people": [
            {"body": "#f06f86", "accent": "#ffd8e3"},
            {"body": "#6f70f5", "accent": "#e2e4ff"},
            {"body": "#f7c15e", "accent": "#fff2c7"},
        ],
        "details": ["bar", "lamps", "bottles"],
    },
    {
        "filename": "dancefloor-neon-club.svg",
        "title": "Neon club dancefloor",
        "gradient": ("#050510", "#ff4f8b"),
        "horizon": "#ffd0f0",
        "people": [
            {"body": "#5d61ff", "accent": "#dbe0ff"},
            {"body": "#ff8a5c", "accent": "#ffe2ce"},
            {"body": "#41d3bd", "accent": "#ddfff6"},
        ],
        "details": ["laser", "disco", "confetti"],
    },
    {
        "filename": "poolside-celebration.svg",
        "title": "Poolside evening celebration",
        "gradient": ("#021526", "#5fd1fb"),
        "horizon": "#c8f3ff",
        "people": [
            {"body": "#f472b6", "accent": "#ffd6f0"},
            {"body": "#38bdf8", "accent": "#d8f2ff"},
            {"body": "#facc15", "accent": "#fff6b7"},
        ],
        "details": ["pool", "palm", "lanterns"],
    },
    {
        "filename": "fireworks-rooftop-party.svg",
        "title": "Rooftop party with fireworks",
        "gradient": ("#030817", "#f45c7a"),
        "horizon": "#f7d9d7",
        "people": [
            {"body": "#f97316", "accent": "#ffddb7"},
            {"body": "#6366f1", "accent": "#e0e2ff"},
            {"body": "#0ea5e9", "accent": "#cbeaff"},
        ],
        "details": ["skyline", "fireworks", "stringlights"],
    },
    {
        "filename": "lounge-bar-friends.svg",
        "title": "Chic lounge bar gathering",
        "gradient": ("#0b101f", "#f7876e"),
        "horizon": "#f6d3c4",
        "people": [
            {"body": "#fb7185", "accent": "#ffd6dc"},
            {"body": "#34d399", "accent": "#d3ffe8"},
            {"body": "#fbbf24", "accent": "#ffeec5"},
        ],
        "details": ["bar", "sofas", "lamps"],
    },
    {
        "filename": "sunset-beach-party.svg",
        "title": "Sunset beach party",
        "gradient": ("#051937", "#f45c43"),
        "horizon": "#ffd4a6",
        "people": [
            {"body": "#ff6b6b", "accent": "#ffd6cf"},
            {"body": "#4fd1c5", "accent": "#d6fff7"},
            {"body": "#ffe66d", "accent": "#fff5c7"},
        ],
        "details": ["sun", "waves", "palm"],
    },
    {
        "filename": "candlelit-supper-club.svg",
        "title": "Candlelit supper club",
        "gradient": ("#1a1029", "#f2a97d"),
        "horizon": "#f8e1d2",
        "people": [
            {"body": "#f472b6", "accent": "#ffd6ec"},
            {"body": "#60a5fa", "accent": "#dceaff"},
            {"body": "#facc15", "accent": "#fff1ba"},
        ],
        "details": ["table", "candles", "curtains"],
    },
    {
        "filename": "neon-bar-toast.svg",
        "title": "Neon bar toast",
        "gradient": ("#050815", "#ff5c8d"),
        "horizon": "#f6c5dc",
        "people": [
            {"body": "#22d3ee", "accent": "#d3f7ff"},
            {"body": "#f97316", "accent": "#ffdabb"},
            {"body": "#a855f7", "accent": "#ecd7ff"},
        ],
        "details": ["bar", "neon", "confetti"],
    },
    {
        "filename": "tropical-beach-dancing.svg",
        "title": "Tropical beach dancing",
        "gradient": ("#041b2d", "#ff9966"),
        "horizon": "#ffe0b2",
        "people": [
            {"body": "#fb7185", "accent": "#ffd0dc"},
            {"body": "#34d399", "accent": "#d4ffe7"},
            {"body": "#38bdf8", "accent": "#d0f1ff"},
        ],
        "details": ["palm", "waves", "confetti"],
    },
    {
        "filename": "festival-night-crowd.svg",
        "title": "Night festival crowd",
        "gradient": ("#070318", "#ff5f6d"),
        "horizon": "#f7cad3",
        "people": [
            {"body": "#6366f1", "accent": "#e1e3ff"},
            {"body": "#f97316", "accent": "#ffd9bb"},
            {"body": "#14b8a6", "accent": "#cbfff4"},
        ],
        "details": ["stage", "spotlights", "confetti"],
    },
    {
        "filename": "white-party-terrace.svg",
        "title": "Elegant white terrace party",
        "gradient": ("#0f172a", "#f5e0d3"),
        "horizon": "#ffffff",
        "people": [
            {"body": "#f9a8d4", "accent": "#ffe4f3"},
            {"body": "#a5b4fc", "accent": "#e8ecff"},
            {"body": "#fde68a", "accent": "#fff6cc"},
        ],
        "details": ["terrace", "stringlights", "palm"],
    },
    {
        "filename": "coastal-dinner-gathering.svg",
        "title": "Coastal dinner gathering",
        "gradient": ("#0a1f2f", "#f5a970"),
        "horizon": "#fbe6c8",
        "people": [
            {"body": "#f472b6", "accent": "#ffd6ec"},
            {"body": "#2dd4bf", "accent": "#c9fff3"},
            {"body": "#facc15", "accent": "#fff3b5"},
        ],
        "details": ["table", "sun", "waves"],
    },
]


def render_people(scene: dict[str, object]) -> str:
    people_markup: list[str] = []
    base_x = 200
    for index, person in enumerate(scene["people"]):
        offset = base_x + index * 140
        body_color = person["body"]
        accent_color = person["accent"]
        people_markup.append(
            dedent(
                f"""
                <g transform=\"translate({offset}, 250)\">
                  <circle cx=\"0\" cy=\"-70\" r=\"34\" fill=\"{accent_color}\" opacity=\"0.9\" />
                  <path d=\"M -42 60 C -30 10 -18 -30 0 -30 C 18 -30 30 10 42 60 Z\" fill=\"{body_color}\" opacity=\"0.92\" />
                  <path d=\"M -50 50 Q 0 -10 50 50 Z\" fill=\"{accent_color}\" opacity=\"0.6\" />
                </g>
                """
            ).strip()
        )
    return "\n".join(people_markup)


DETAIL_RENDERERS: dict[str, str] = {
    "bonfire": dedent(
        """
        <g transform=\"translate(400, 360)\">
          <path d=\"M -30 60 L 0 -20 L 30 60 Z\" fill=\"#ffb347\" opacity=\"0.85\" />
          <path d=\"M -20 60 L 0 0 L 20 60 Z\" fill=\"#ff6f61\" opacity=\"0.8\" />
          <ellipse cx=\"0\" cy=\"70\" rx=\"70\" ry=\"20\" fill=\"#402312\" opacity=\"0.6\" />
        </g>
        """
    ).strip(),
    "palm": dedent(
        """
        <g transform=\"translate(620, 240)\">
          <rect x=\"-8\" y=\"0\" width=\"16\" height=\"220\" fill=\"#4f2c1d\" />
          <path d=\"M 0 0 C 80 -40 120 -10 140 40 C 60 20 20 40 0 0 Z\" fill=\"#1acaa1\" opacity=\"0.7\" />
          <path d=\"M 0 20 C 70 -10 110 20 130 70 C 50 40 20 60 0 20 Z\" fill=\"#25f5c7\" opacity=\"0.6\" />
        </g>
        """
    ).strip(),
    "stars": dedent(
        """
        <g fill=\"#ffe7b3\" opacity=\"0.7\">
          <circle cx=\"120\" cy=\"120\" r=\"3\" />
          <circle cx=\"680\" cy=\"80\" r=\"4\" />
          <circle cx=\"540\" cy=\"150\" r=\"2.5\" />
          <circle cx=\"300\" cy=\"60\" r=\"3.5\" />
          <circle cx=\"460\" cy=\"40\" r=\"2\" />
        </g>
        """
    ).strip(),
    "boat": dedent(
        """
        <g transform=\"translate(520, 360)\">
          <path d=\"M -120 40 L 120 40 L 80 80 L -80 80 Z\" fill=\"#2d2e83\" opacity=\"0.85\" />
          <path d=\"M 0 40 L 0 -100 L 90 10 Z\" fill=\"#fef0d3\" opacity=\"0.9\" />
        </g>
        """
    ).strip(),
    "waves": dedent(
        """
        <path d=\"M 0 420 Q 100 380 200 420 T 400 420 T 600 420 T 800 420 V 600 H 0 Z\" fill=\"rgba(99, 179, 237, 0.45)\" />
        <path d=\"M 0 460 Q 120 430 240 460 T 480 460 T 720 460 T 840 460 V 600 H 0 Z\" fill=\"rgba(56, 189, 248, 0.4)\" />
        """
    ).strip(),
    "sun": "<circle cx=\"140\" cy=\"140\" r=\"70\" fill=\"#ffd783\" opacity=\"0.75\" />",
    "table": dedent(
        """
        <g transform=\"translate(400, 410)\">
          <ellipse cx=\"0\" cy=\"0\" rx=\"220\" ry=\"70\" fill=\"rgba(63, 39, 35, 0.6)\" />
          <ellipse cx=\"0\" cy=\"-20\" rx=\"200\" ry=\"60\" fill=\"rgba(255, 244, 214, 0.85)\" />
        </g>
        """
    ).strip(),
    "lanterns": dedent(
        """
        <g fill=\"#ffd8a8\" opacity=\"0.7\">
          <path d=\"M 140 140 Q 400 60 660 140\" stroke=\"#f5c686\" stroke-width=\"6\" fill=\"none\" />
          <circle cx=\"260\" cy=\"120\" r=\"20\" />
          <circle cx=\"400\" cy=\"90\" r=\"24\" />
          <circle cx=\"540\" cy=\"120\" r=\"18\" />
        </g>
        """
    ).strip(),
    "foliage": dedent(
        """
        <g fill=\"#357960\" opacity=\"0.7\">
          <path d=\"M 40 500 C 120 420 160 520 200 440 C 220 540 160 560 140 600 H 0 Z\" />
          <path d=\"M 600 600 C 620 520 700 520 760 440 C 780 520 760 560 720 600 Z\" />
        </g>
        """
    ).strip(),
    "bar": dedent(
        """
        <g transform=\"translate(400, 420)\">
          <rect x=\"-260\" y=\"-60\" width=\"520\" height=\"140\" fill=\"rgba(38, 20, 43, 0.7)\" rx=\"30\" />
          <rect x=\"-220\" y=\"-80\" width=\"440\" height=\"40\" fill=\"rgba(255, 224, 200, 0.6)\" rx=\"20\" />
        </g>
        """
    ).strip(),
    "lamps": dedent(
        """
        <g fill=\"#ffd7a8\" opacity=\"0.7\">
          <path d=\"M 200 120 L 200 220\" stroke=\"#ffd7a8\" stroke-width=\"4\" />
          <ellipse cx=\"200\" cy=\"240\" rx=\"24\" ry=\"16\" />
          <path d=\"M 600 120 L 600 220\" stroke=\"#ffd7a8\" stroke-width=\"4\" />
          <ellipse cx=\"600\" cy=\"240\" rx=\"24\" ry=\"16\" />
        </g>
        """
    ).strip(),
    "bottles": dedent(
        """
        <g transform=\"translate(400, 320)\" opacity=\"0.8\">
          <path d=\"M -120 0 L -100 0 L -96 -40 L -104 -40 Z\" fill=\"#66d9e8\" />
          <path d=\"M -20 0 L 0 0 L 6 -36 L -6 -36 Z\" fill=\"#ff99c8\" />
          <path d=\"M 80 0 L 96 0 L 102 -44 L 74 -44 Z\" fill=\"#f6d365\" />
        </g>
        """
    ).strip(),
    "laser": dedent(
        """
        <g opacity=\"0.6\">
          <path d=\"M 0 0 L 200 220\" stroke=\"#5eead4\" stroke-width=\"6\" />
          <path d=\"M 800 0 L 600 220\" stroke=\"#a855f7\" stroke-width=\"6\" />
          <path d=\"M 400 0 L 400 220\" stroke=\"#f97316\" stroke-width=\"6\" />
        </g>
        """
    ).strip(),
    "disco": "<circle cx=\"400\" cy=\"140\" r=\"60\" fill=\"#fef2f8\" opacity=\"0.75\" />",
    "confetti": dedent(
        """
        <g opacity=\"0.75\">
          <rect x=\"120\" y=\"60\" width=\"6\" height=\"24\" fill=\"#facc15\" />
          <rect x=\"620\" y=\"90\" width=\"6\" height=\"18\" fill=\"#60a5fa\" />
          <rect x=\"300\" y=\"110\" width=\"6\" height=\"20\" fill=\"#fb7185\" />
          <rect x=\"520\" y=\"70\" width=\"6\" height=\"22\" fill=\"#34d399\" />
          <rect x=\"700\" y=\"140\" width=\"6\" height=\"18\" fill=\"#a855f7\" />
        </g>
        """
    ).strip(),
    "pool": dedent(
        """
        <ellipse cx=\"200\" cy=\"460\" rx=\"180\" ry=\"70\" fill=\"rgba(56, 189, 248, 0.5)\" />
        <ellipse cx=\"200\" cy=\"470\" rx=\"150\" ry=\"50\" fill=\"rgba(14, 165, 233, 0.45)\" />
        """
    ).strip(),
    "skyline": dedent(
        """
        <g fill=\"rgba(33, 33, 68, 0.7)\">
          <rect x=\"60\" y=\"320\" width=\"80\" height=\"180\" />
          <rect x=\"160\" y=\"360\" width=\"100\" height=\"140\" />
          <rect x=\"320\" y=\"300\" width=\"120\" height=\"200\" />
          <rect x=\"500\" y=\"340\" width=\"140\" height=\"160\" />
          <rect x=\"680\" y=\"320\" width=\"90\" height=\"180\" />
        </g>
        """
    ).strip(),
    "fireworks": dedent(
        """
        <g stroke=\"#ffe066\" stroke-width=\"4\" opacity=\"0.8\" fill=\"none\">
          <circle cx=\"160\" cy=\"140\" r=\"30\" />
          <path d=\"M 160 110 L 160 70\" />
          <path d=\"M 130 140 L 90 140\" />
          <path d=\"M 190 140 L 230 140\" />
          <path d=\"M 160 170 L 160 210\" />
        </g>
        <g stroke=\"#60a5fa\" stroke-width=\"4\" opacity=\"0.8\" fill=\"none\">
          <circle cx=\"600\" cy=\"120\" r=\"36\" />
          <path d=\"M 600 84 L 600 40\" />
          <path d=\"M 564 120 L 520 120\" />
          <path d=\"M 636 120 L 680 120\" />
          <path d=\"M 600 156 L 600 200\" />
        </g>
        """
    ).strip(),
    "stringlights": dedent(
        """
        <path d=\"M 60 120 Q 400 40 740 120\" stroke=\"rgba(255, 224, 178, 0.7)\" stroke-width=\"6\" fill=\"none\" />
        <g fill=\"#ffe0b2\" opacity=\"0.8\">
          <circle cx=\"160\" cy=\"110\" r=\"16\" />
          <circle cx=\"320\" cy=\"80\" r=\"20\" />
          <circle cx=\"480\" cy=\"90\" r=\"18\" />
          <circle cx=\"640\" cy=\"110\" r=\"16\" />
        </g>
        """
    ).strip(),
    "sofas": dedent(
        """
        <g transform=\"translate(400, 470)\" opacity=\"0.65\">
          <rect x=\"-260\" y=\"-40\" width=\"200\" height=\"80\" rx=\"40\" fill=\"#fcd5ce\" />
          <rect x=\"60\" y=\"-40\" width=\"200\" height=\"80\" rx=\"40\" fill=\"#fecdd3\" />
        </g>
        """
    ).strip(),
    "candles": dedent(
        """
        <g transform=\"translate(400, 330)\" fill=\"#ffe0b2\" opacity=\"0.85\">
          <rect x=\"-60\" y=\"-40\" width=\"12\" height=\"40\" rx=\"6\" />
          <circle cx=\"-54\" cy=\"-44\" r=\"8\" fill=\"#ffd29d\" />
          <rect x=\"0\" y=\"-40\" width=\"12\" height=\"40\" rx=\"6\" />
          <circle cx=\"6\" cy=\"-44\" r=\"8\" fill=\"#ffd29d\" />
          <rect x=\"60\" y=\"-40\" width=\"12\" height=\"40\" rx=\"6\" />
          <circle cx=\"66\" cy=\"-44\" r=\"8\" fill=\"#ffd29d\" />
        </g>
        """
    ).strip(),
    "curtains": dedent(
        """
        <path d=\"M 0 0 Q 80 140 120 0 V 600 H 0 Z\" fill=\"rgba(111, 52, 84, 0.45)\" />
        <path d=\"M 800 0 Q 720 140 680 0 V 600 H 800 Z\" fill=\"rgba(111, 52, 84, 0.45)\" />
        """
    ).strip(),
    "neon": dedent(
        """
        <g opacity=\"0.7\">
          <rect x=\"240\" y=\"110\" width=\"320\" height=\"120\" rx=\"60\" stroke=\"#ff9edb\" stroke-width=\"10\" fill=\"none\" />
          <text x=\"400\" y=\"190\" font-size=\"60\" text-anchor=\"middle\" fill=\"#ffb4e6\" font-family=\"'Gill Sans', 'Arial', sans-serif\">CHEERS</text>
        </g>
        """
    ).strip(),
    "stage": dedent(
        """
        <g transform=\"translate(400, 420)\" opacity=\"0.7\">
          <rect x=\"-260\" y=\"20\" width=\"520\" height=\"60\" fill=\"#1f2937\" />
          <rect x=\"-200\" y=\"-40\" width=\"400\" height=\"60\" fill=\"#312e81\" />
        </g>
        """
    ).strip(),
    "spotlights": dedent(
        """
        <g opacity=\"0.4\">
          <path d=\"M 120 0 L 240 0 L 400 300 L 300 300 Z\" fill=\"#60a5fa\" />
          <path d=\"M 680 0 L 560 0 L 400 300 L 500 300 Z\" fill=\"#fbbf24\" />
        </g>
        """
    ).strip(),
    "terrace": dedent(
        """
        <path d=\"M 0 420 Q 200 360 400 420 T 800 420 V 600 H 0 Z\" fill=\"rgba(255, 255, 255, 0.6)\" />
        <path d=\"M 0 380 Q 200 320 400 380 T 800 380\" stroke=\"rgba(148, 163, 184, 0.6)\" stroke-width=\"6\" fill=\"none\" />
        """
    ).strip(),
}


def render_details(scene: dict[str, object]) -> str:
    snippets = []
    for detail in scene["details"]:
        snippet = DETAIL_RENDERERS.get(detail)
        if snippet is None:
            raise ValueError(f"Unknown detail: {detail}")
        snippets.append(snippet)
    return "\n".join(snippets)


def render_scene(scene: dict[str, object]) -> str:
    gradient_start, gradient_end = scene["gradient"]
    horizon_color = scene["horizon"]
    people_markup = render_people(scene)
    details_markup = render_details(scene)

    return dedent(
        f"""
        <svg width=\"800\" height=\"600\" viewBox=\"0 0 800 600\" xmlns=\"http://www.w3.org/2000/svg\" role=\"img\" aria-labelledby=\"title\">
          <title>{scene['title']}</title>
          <defs>
            <linearGradient id=\"bg\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">
              <stop offset=\"0%\" stop-color=\"{gradient_start}\" />
              <stop offset=\"100%\" stop-color=\"{gradient_end}\" />
            </linearGradient>
          </defs>
          <rect width=\"800\" height=\"600\" fill=\"url(#bg)\" />
          <rect y=\"320\" width=\"800\" height=\"280\" fill=\"{horizon_color}\" opacity=\"0.4\" />
          {details_markup}
          {people_markup}
        </svg>
        """
    ).strip()


def main() -> None:
    for scene in SCENES:
        svg_content = render_scene(scene)
        output_path = OUTPUT_DIR / scene["filename"]
        output_path.write_text(svg_content, encoding="utf-8")


if __name__ == "__main__":
    main()
