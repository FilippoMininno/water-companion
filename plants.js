"use strict";

/*
 * Plant species artwork & selection for the Hydra water companion.
 * Pure data + string builders: no DOM access, unit-testable under Node.
 * Coordinate space: viewBox 0 0 200 260, stem base at (100, 190).
 */
(function (root) {
  function petalRing(cx, cy, n, rx, ry, fill, extra) {
    var s = "";
    for (var i = 0; i < n; i++) {
      var a = (360 / n) * i;
      s += '<ellipse cx="' + cx + '" cy="' + (cy - ry) + '" rx="' + rx + '" ry="' + ry +
        '" fill="' + fill + '" transform="rotate(' + a + " " + cx + " " + cy + ')"' + (extra || "") + "/>";
    }
    return s;
  }

  const SPECIES = [
    {
      id: "rose",
      name: "Rose",
      color: "#e5484d",
      bloomOrigin: "100px 44px",
      markup:
        '<path class="stem" d="M100 190 C97 160 103 128 99 96 C97 80 101 70 100 56" stroke="#3e7d46" stroke-width="7" fill="none" stroke-linecap="round"/>' +
        '<path class="leaf" d="M100 150 C80 150 64 138 58 118 C80 112 98 126 100 150 Z" fill="#4f9d55"/>' +
        '<path class="vein" d="M97 148 C86 142 74 134 64 124" stroke="#3c7a42" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
        '<path class="leaf" d="M100 120 C120 120 136 108 142 88 C120 82 102 96 100 120 Z" fill="#5cb262"/>' +
        '<path class="vein" d="M103 118 C114 112 126 104 136 94" stroke="#468a4b" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
        '<path class="leaf" d="M99 172 C86 168 78 160 76 148 C90 146 99 156 99 172 Z" fill="#4f9d55"/>' +
        '<g class="bloom-part" style="--bloom-origin:100px 44px">' +
          '<radialGradient id="grad-rose" cx="0.4" cy="0.35" r="0.9"><stop offset="0" stop-color="#ff9d9d"/><stop offset="1" stop-color="#d0404a"/></radialGradient>' +
          '<path d="M100 64 C90 58 86 48 90 38 L100 46 L110 38 C114 48 110 58 100 64 Z" fill="#3e7d46"/>' +
          '<circle cx="100" cy="44" r="20" fill="url(#grad-rose)"/>' +
          '<path d="M84 40 C84 26 94 16 106 18 C118 20 122 34 116 46 C110 56 94 58 88 50 C84 46 82 44 84 40 Z" fill="url(#grad-rose)"/>' +
          '<path d="M92 30 C96 24 104 24 108 30 C112 36 108 44 100 44 C92 44 88 36 92 30 Z" fill="#ff9296"/>' +
          '<path d="M96 26 C99 22 103 22 106 26 C104 31 102 34 100 34 C98 34 96 31 96 26 Z" fill="#ffb3b6"/>' +
          '<circle cx="100" cy="41" r="5" fill="#b2353c"/>' +
        "</g>",
    },
    {
      id: "tulip",
      name: "Tulip",
      color: "#ff8f42",
      bloomOrigin: "100px 50px",
      markup:
        '<path class="stem" d="M100 190 C100 156 100 122 100 86" stroke="#4c8c3b" stroke-width="7" fill="none" stroke-linecap="round"/>' +
        '<path class="leaf" d="M100 168 C82 164 68 148 64 122 C84 124 98 140 100 168 Z" fill="#57a344"/>' +
        '<path class="vein" d="M97 164 C86 156 76 144 70 130" stroke="#3f7d33" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
        '<path class="leaf" d="M100 176 C118 172 132 156 136 130 C116 132 102 148 100 176 Z" fill="#63b350"/>' +
        '<path class="vein" d="M103 172 C114 164 124 152 130 138" stroke="#4c8f3a" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
        '<g class="bloom-part" style="--bloom-origin:100px 50px">' +
          '<linearGradient id="grad-tulip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc27d"/><stop offset="1" stop-color="#f07018"/></linearGradient>' +
          '<path d="M78 60 C78 40 84 24 100 22 C116 24 122 40 122 60 C118 70 108 74 100 74 C92 74 82 70 78 60 Z" fill="url(#grad-tulip)"/>' +
          '<path d="M84 58 C84 42 88 30 100 28 C112 30 116 42 116 58 C112 64 106 66 100 66 C94 66 88 64 84 58 Z" fill="#ffab6b"/>' +
          '<path d="M92 32 C96 28 104 28 108 32 C106 38 104 42 100 42 C96 42 94 38 92 32 Z" fill="#ff7a2f"/>' +
          '<path d="M86 56 C90 62 96 66 100 66 C104 66 110 62 114 56 L114 60 C110 68 104 72 100 72 C96 72 90 68 86 60 Z" fill="#e56f24"/>' +
        "</g>",
    },
    {
      id: "sunflower",
      name: "Sunflower",
      color: "#ffc247",
      bloomOrigin: "100px 62px",
      markup:
        '<path class="stem" d="M100 190 C100 160 102 130 100 96" stroke="#4c8c3b" stroke-width="9" fill="none" stroke-linecap="round"/>' +
        '<path class="leaf" d="M100 152 C74 154 56 138 50 112 C78 106 98 124 100 152 Z" fill="#57a344"/>' +
        '<path class="vein" d="M97 148 C82 142 66 130 56 118" stroke="#3f7d33" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<path class="leaf" d="M100 130 C126 132 144 116 150 90 C122 84 102 102 100 130 Z" fill="#63b350"/>' +
        '<path class="vein" d="M103 126 C118 120 134 108 144 96" stroke="#4c8f3a" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<path class="leaf" d="M100 172 C84 168 76 158 74 146 C90 144 99 156 100 172 Z" fill="#57a344"/>' +
        '<g class="bloom-part" style="--bloom-origin:100px 62px">' +
          '<radialGradient id="grad-sunflower" cx="0.5" cy="0.5" r="0.8"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#ff9e2c"/></radialGradient>' +
          petalRing(100, 62, 14, 6, 24, "url(#grad-sunflower)") +
          petalRing(100, 62, 14, 4, 18, "#ffd76e") +
          '<circle cx="100" cy="62" r="14" fill="#6b4423"/>' +
          '<circle cx="94" cy="58" r="2" fill="#8a5a30"/><circle cx="104" cy="57" r="2" fill="#8a5a30"/>' +
          '<circle cx="100" cy="66" r="2" fill="#8a5a30"/><circle cx="95" cy="67" r="1.6" fill="#8a5a30"/>' +
          '<circle cx="106" cy="66" r="1.6" fill="#8a5a30"/><circle cx="99" cy="61" r="2.4" fill="#54351b"/>' +
        "</g>",
    },
    {
      id: "daisy",
      name: "Daisy",
      color: "#ffffff",
      bloomOrigin: "100px 52px",
      markup:
        '<path class="stem" d="M100 190 C99 160 101 130 100 100 C99 88 101 80 100 74" stroke="#6aa84f" stroke-width="4.5" fill="none" stroke-linecap="round"/>' +
        '<path class="leaf" d="M100 156 C86 152 78 142 76 130 C90 130 99 140 100 156 Z" fill="#7ab862"/>' +
        '<path class="vein" d="M98 152 C91 146 85 140 81 134" stroke="#5b9440" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
        '<path class="leaf" d="M100 132 C114 128 122 118 124 106 C110 106 101 116 100 132 Z" fill="#86c46e"/>' +
        '<path class="vein" d="M102 128 C109 122 115 116 119 110" stroke="#5b9440" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
        '<path class="bloom-part" style="--bloom-origin:100px 52px">' +
          '<radialGradient id="grad-daisy" cx="0.5" cy="0.5" r="0.8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e8e4f0"/></radialGradient>' +
          petalRing(100, 52, 12, 4, 19, "url(#grad-daisy)", ' stroke="#e8eef2" stroke-width="0.6"') +
          '<circle cx="100" cy="52" r="9" fill="#ffd166"/>' +
          '<circle cx="97" cy="49" r="1.8" fill="#eab53e"/><circle cx="103" cy="54" r="1.8" fill="#eab53e"/>' +
          '<circle cx="98" cy="55" r="1.4" fill="#eab53e"/>' +
        "</g>",
    },
    {
      id: "bellflower",
      name: "Bellflower",
      color: "#8b7cf8",
      bloomOrigin: "100px 60px",
      markup:
        '<path class="stem" d="M100 190 C98 160 104 132 100 104 C99 92 101 84 100 74" stroke="#4f8f57" stroke-width="6" fill="none" stroke-linecap="round"/>' +
        '<path class="stem" d="M100 104 C92 96 84 92 76 90" stroke="#4f8f57" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        '<path class="stem" d="M100 116 C108 108 116 104 124 102" stroke="#4f8f57" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        '<path class="leaf" d="M100 150 C82 148 70 138 66 122 C84 118 98 128 100 150 Z" fill="#5da367"/>' +
        '<path class="vein" d="M97 146 C86 140 76 132 70 126" stroke="#47804f" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
        '<path class="leaf" d="M100 136 C118 134 130 124 134 108 C116 104 102 114 100 136 Z" fill="#69b173"/>' +
        '<path class="vein" d="M103 132 C114 126 124 118 128 112" stroke="#4f8f57" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
        '<g class="bloom-part" style="--bloom-origin:100px 60px">' +
          '<linearGradient id="grad-bell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b3a7ff"/><stop offset="1" stop-color="#6d5ce7"/></linearGradient>' +
          '<path d="M88 46 C88 60 94 70 100 70 C106 70 112 60 112 46 C104 50 96 50 88 46 Z" fill="url(#grad-bell)"/>' +
          '<path d="M90 46 C92 58 96 66 100 66 C102 62 104 52 104 46 C99 49 95 49 90 46 Z" fill="#a79af9"/>' +
          '<path d="M96 68 L100 76 L104 68 Z" fill="#6d5ce7"/>' +
          '<path d="M70 86 C70 96 75 103 80 103 C85 103 90 96 90 86 C83 89 77 89 70 86 Z" fill="#7b6cf6" transform="rotate(24 80 95)"/>' +
          '<path d="M110 98 C110 108 115 115 120 115 C125 115 130 108 130 98 C123 101 117 101 110 98 Z" fill="#9c8ffb" transform="rotate(-20 120 107)"/>' +
        "</g>",
    },
    {
      id: "poppy",
      name: "Poppy",
      color: "#ff5f5f",
      bloomOrigin: "100px 48px",
      markup:
        '<path class="stem" d="M100 190 C96 160 106 124 100 92" stroke="#5e8c61" stroke-width="5" fill="none" stroke-linecap="round"/>' +
        '<path class="leaf" d="M100 150 C82 148 70 140 66 128 C82 124 98 132 100 150 Z" fill="#6da070"/>' +
        '<path class="vein" d="M97 146 C87 141 78 136 72 130" stroke="#527a55" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
        '<path class="leaf" d="M100 128 C118 126 130 118 134 106 C118 102 102 110 100 128 Z" fill="#79ac7c"/>' +
        '<path class="vein" d="M103 124 C113 119 122 114 128 108" stroke="#5c8a5f" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
        '<path class="leaf" d="M99 172 C88 168 82 160 82 150 C94 150 99 160 99 172 Z" fill="#6da070"/>' +
        '<g class="bloom-part" style="--bloom-origin:100px 48px">' +
          '<radialGradient id="grad-poppy" cx="0.4" cy="0.35" r="0.9"><stop offset="0" stop-color="#ff9d8f"/><stop offset="1" stop-color="#ee4444"/></radialGradient>' +
          '<circle cx="86" cy="46" r="17" fill="url(#grad-poppy)"/>' +
          '<circle cx="114" cy="46" r="17" fill="url(#grad-poppy)"/>' +
          '<circle cx="100" cy="32" r="17" fill="url(#grad-poppy)"/>' +
          '<circle cx="100" cy="60" r="17" fill="url(#grad-poppy)"/>' +
          '<circle cx="88" cy="42" r="12" fill="#ff8f8f" opacity="0.55"/>' +
          '<circle cx="100" cy="48" r="9" fill="#2b2b2b"/>' +
          '<circle cx="96" cy="44" r="1.6" fill="#4d4d3d"/><circle cx="104" cy="45" r="1.6" fill="#4d4d3d"/>' +
          '<circle cx="100" cy="51" r="1.6" fill="#4d4d3d"/><circle cx="94" cy="50" r="1.4" fill="#4d4d3d"/>' +
        "</g>",
    },
  ];

  const SICK_MARKUP =
    '<g class="sick-marks">' +
      '<path d="M92 168 q4 -5 8 0" stroke="#2e5d36" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<path d="M112 150 q4 -5 8 0" stroke="#2e5d36" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    "</g>";

  function byId(id) {
    for (var i = 0; i < SPECIES.length; i++) {
      if (SPECIES[i].id === id) return SPECIES[i];
    }
    return null;
  }

  function markupFor(id) {
    var s = byId(id) || SPECIES[0];
    return s.markup + SICK_MARKUP;
  }

  function speciesFor(id) {
    return byId(id) || SPECIES[0];
  }

  /* Deterministic pick for a given seed (e.g. day key + user salt). */
  function pickSpecies(seed) {
    var h = 0;
    var str = String(seed);
    for (var i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) >>> 0;
    }
    return SPECIES[h % SPECIES.length].id;
  }

  function randomSpecies(rng) {
    var r = typeof rng === "function" ? rng() : Math.random();
    var idx = Math.floor(r * SPECIES.length) % SPECIES.length;
    return SPECIES[idx].id;
  }

  /* Small standalone SVG (for the garden / transplant clone). Blooms are
     always visible here because .bloom-part only hides inside #plant-body. */
  function svgFor(id, size) {
    var s = speciesFor(id);
    var w = size || 100;
    return (
      '<svg viewBox="0 0 200 260" width="' + w + '" height="' + Math.round(w * 1.3) + '" aria-hidden="true">' +
      s.markup +
      "</svg>"
    );
  }

  /* Ambient insects that appear as the garden fills up. */
  const INSECTS = [
    {
      id: "butterfly",
      svg:
        '<svg viewBox="0 0 44 36" width="36" aria-hidden="true">' +
          '<g class="insect-wing wing-l">' +
            '<path d="M22 18 C12 2 1 4 2 13 C3 21 13 23 22 20 Z" fill="#c77dff"/>' +
            '<path d="M22 18 C13 30 4 33 3 26 C2 21 12 17 22 19 Z" fill="#e0aaff"/>' +
          "</g>" +
          '<g class="insect-wing wing-r">' +
            '<path d="M22 18 C32 2 43 4 42 13 C41 21 31 23 22 20 Z" fill="#c77dff"/>' +
            '<path d="M22 18 C31 30 40 33 41 26 C42 21 32 17 22 19 Z" fill="#e0aaff"/>' +
          "</g>" +
          '<ellipse cx="22" cy="18" rx="2.4" ry="9" fill="#4a3b55"/>' +
        "</svg>",
    },
    {
      id: "bee",
      svg:
        '<svg viewBox="0 0 44 36" width="32" aria-hidden="true">' +
          '<g class="insect-wing wing-l">' +
            '<ellipse cx="16" cy="10" rx="7" ry="4.5" fill="#dff3ff" opacity="0.75" transform="rotate(-24 16 10)"/>' +
          "</g>" +
          '<g class="insect-wing wing-r">' +
            '<ellipse cx="28" cy="10" rx="7" ry="4.5" fill="#dff3ff" opacity="0.75" transform="rotate(24 28 10)"/>' +
          "</g>" +
          '<ellipse cx="22" cy="20" rx="9" ry="6.5" fill="#ffd166"/>' +
          '<path d="M18 14.5 C19 18 19 22 18 25.5" stroke="#3d3d3d" stroke-width="2.4" fill="none"/>' +
          '<path d="M23 14 C24 18 24 22 23 26" stroke="#3d3d3d" stroke-width="2.4" fill="none"/>' +
          '<circle cx="13.5" cy="19" r="3.4" fill="#3d3d3d"/>' +
          '<path d="M31 21 L36 23 M31 18 L36 16" stroke="#3d3d3d" stroke-width="1.4" stroke-linecap="round"/>' +
        "</svg>",
    },
    {
      id: "ladybug",
      svg:
        '<svg viewBox="0 0 44 36" width="28" aria-hidden="true">' +
          '<g class="insect-wing wing-l">' +
            '<ellipse cx="15" cy="11" rx="6" ry="3.6" fill="#dff3ff" opacity="0.65" transform="rotate(-20 15 11)"/>' +
          "</g>" +
          '<g class="insect-wing wing-r">' +
            '<ellipse cx="29" cy="11" rx="6" ry="3.6" fill="#dff3ff" opacity="0.65" transform="rotate(20 29 11)"/>' +
          "</g>" +
          '<ellipse cx="22" cy="21" rx="8" ry="7" fill="#e5484d"/>' +
          '<path d="M22 14 L22 28" stroke="#2b2b2b" stroke-width="1.6"/>' +
          '<circle cx="18" cy="18" r="1.4" fill="#2b2b2b"/><circle cx="26" cy="19" r="1.4" fill="#2b2b2b"/>' +
          '<circle cx="19" cy="24" r="1.2" fill="#2b2b2b"/><circle cx="25" cy="24" r="1.2" fill="#2b2b2b"/>' +
          '<circle cx="22" cy="13" r="3.6" fill="#2b2b2b"/>' +
        "</svg>",
    },
  ];

  function insectFor(id) {
    for (var i = 0; i < INSECTS.length; i++) {
      if (INSECTS[i].id === id) return INSECTS[i];
    }
    return INSECTS[0];
  }

  /* Grass tuft for the garden hill. variant: 0..2 color schemes. */
  function grassTuft(variant) {
    var v = ((variant % 3) + 3) % 3;
    var colors = ["#6fae4e", "#7fbe5c", "#5f9c44"];
    var a = colors[v];
    var b = colors[(v + 1) % 3];
    var c = colors[(v + 2) % 3];
    return (
      '<svg viewBox="0 0 40 32" width="46" aria-hidden="true">' +
        '<path d="M20 32 C19 22 17 14 13 6" stroke="' + a + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M20 32 C20 20 20 12 21 3" stroke="' + b + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M20 32 C22 24 26 16 32 9" stroke="' + a + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M20 32 C18 26 14 20 8 15" stroke="' + c + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
        '<path d="M20 32 C22 28 27 23 34 20" stroke="' + b + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
        '<path d="M20 32 C17 27 12 24 6 22" stroke="' + c + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      "</svg>"
    );
  }

  var api = {
    SPECIES: SPECIES,
    INSECTS: INSECTS,
    SICK_MARKUP: SICK_MARKUP,
    markupFor: markupFor,
    speciesFor: speciesFor,
    pickSpecies: pickSpecies,
    randomSpecies: randomSpecies,
    svgFor: svgFor,
    insectFor: insectFor,
    grassTuft: grassTuft,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.Plants = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
