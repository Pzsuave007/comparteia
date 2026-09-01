import React, { useEffect, useState } from "react";

const FACE_ROT = {
  1: { x: 0, y: 0 },
  6: { x: 0, y: -180 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  2: { x: -90, y: 0 },
  5: { x: 90, y: 0 },
};

const PIPS = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};

function Face({ transform }) {
  const [showN, setShowN] = useState(1);
  return null; // faces rendered below
}

// value: 1-6 or null. rolling: boolean triggers spin.
export default function Dice({ value, rolling, size = 128 }) {
  const h = size / 2;
  const [rot, setRot] = useState({ x: -20, y: 20, spin: 0 });

  useEffect(() => {
    if (value && FACE_ROT[value]) {
      const base = FACE_ROT[value];
      setRot((r) => ({ x: base.x + 720, y: base.y + 720, spin: r.spin + 1 }));
    }
  }, [value, rolling]);

  const faceStyle = (n) => {
    const map = {
      1: `rotateY(0deg) translateZ(${h}px)`,
      6: `rotateY(180deg) translateZ(${h}px)`,
      3: `rotateY(90deg) translateZ(${h}px)`,
      4: `rotateY(-90deg) translateZ(${h}px)`,
      2: `rotateX(90deg) translateZ(${h}px)`,
      5: `rotateX(-90deg) translateZ(${h}px)`,
    };
    return { transform: map[n], width: size, height: size };
  };

  return (
    <div className="dice-scene" style={{ width: size, height: size }} data-testid="expedition-die">
      <div
        className="dice-cube"
        style={{
          width: size, height: size,
          transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="dice-face" style={faceStyle(n)}>
            <div className="grid grid-cols-3 gap-[10%] p-[16%] w-full h-full">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="flex items-center justify-center">
                  {PIPS[n].includes(i) && (
                    <span
                      className="rounded-full bg-midnight"
                      style={{ width: size * 0.12, height: size * 0.12, boxShadow: "inset 0 -2px 3px rgba(0,0,0,0.4)" }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
