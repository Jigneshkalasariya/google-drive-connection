"use client";

import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";

import { useGoogleDrivePicker } from "@/hooks/useGoogleDrivePicker";

export default function ImagePhysics() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const { isLoaded, openPicker } = useGoogleDrivePicker();

  const handleGoogleDriveSelect = () => {
    openPicker((files) => {
      const imageUrls = files.map((file) => file.url);
      setSelectedImages((prev) => [...prev, ...imageUrls]);
    });
  };

  const handleLocalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const imageUrls: string[] = [];
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      imageUrls.push(url);
    });

    setSelectedImages((prev) => [...prev, ...imageUrls]);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const {
      Engine,
      Render,
      Runner,
      Bodies,
      Composite,
      Mouse,
      MouseConstraint,
    } = Matter;

    // Create engine
    const engine = Engine.create();
    engineRef.current = engine;

    // Create renderer
    const render = Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: "transparent",
      },
    });
    renderRef.current = render;

    // Create ground and walls
    const ground = Bodies.rectangle(
      window.innerWidth / 2,
      window.innerHeight,
      window.innerWidth,
      60,
      {
        isStatic: true,
        render: { fillStyle: "#1f2937" },
      }
    );

    const leftWall = Bodies.rectangle(
      0,
      window.innerHeight / 2,
      60,
      window.innerHeight,
      {
        isStatic: true,
        render: { fillStyle: "#1f2937" },
      }
    );

    const rightWall = Bodies.rectangle(
      window.innerWidth,
      window.innerHeight / 2,
      60,
      window.innerHeight,
      {
        isStatic: true,
        render: { fillStyle: "#1f2937" },
      }
    );

    Composite.add(engine.world, [ground, leftWall, rightWall]);

    // Add mouse control
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false },
      },
    });

    Composite.add(engine.world, mouseConstraint);

    // Run the engine and renderer
    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    // Handle window resize
    const handleResize = () => {
      render.canvas.width = window.innerWidth;
      render.canvas.height = window.innerHeight;
      render.options.width = window.innerWidth;
      render.options.height = window.innerHeight;

      // Update ground and walls
      Matter.Body.setPosition(
        ground,
        Matter.Vector.create(window.innerWidth / 2, window.innerHeight)
      );
      Matter.Body.setPosition(
        rightWall,
        Matter.Vector.create(window.innerWidth, window.innerHeight / 2)
      );
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      render.canvas.remove();
    };
  }, []);

  useEffect(() => {
    if (!engineRef.current || selectedImages.length === 0) return;

    const { Bodies, Composite } = Matter;

    selectedImages.forEach((imageUrl, index) => {
      const img = new Image();
      img.src = imageUrl;

      img.onload = () => {
        const size = 100;
        const x = Math.random() * (window.innerWidth - 200) + 100;
        const y = Math.random() * 200 + 50;

        const imageBody = Bodies.rectangle(x, y, size, size, {
          restitution: 0.6,
          friction: 0.1,
          render: {
            sprite: {
              texture: imageUrl,
              xScale: size / img.width,
              yScale: size / img.height,
            },
          },
        });

        Composite.add(engineRef.current!.world, imageBody);
      };
    });
  }, [selectedImages]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
      <canvas ref={canvasRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="pointer-events-auto text-center">
          <div className="flex flex-col gap-3">
            <button
              onClick={handleGoogleDriveSelect}
              disabled={!isLoaded}
              className="flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-slate-900 shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M8.5 2.5L2 13.5L5.5 19.5L12 8.5L8.5 2.5Z"
                  fill="#0066DA"
                />
                <path
                  d="M15.5 2.5L12 8.5L18.5 19.5L22 13.5L15.5 2.5Z"
                  fill="#00AC47"
                />
                <path
                  d="M5.5 19.5L2 13.5H8.5L12 19.5L18.5 19.5L15.5 13.5H8.5L5.5 19.5Z"
                  fill="#EA4335"
                />
                <path d="M12 8.5L8.5 13.5H15.5L12 8.5Z" fill="#00832D" />
                <path d="M12 19.5L8.5 13.5L5.5 19.5H12Z" fill="#2684FC" />
                <path d="M18.5 19.5L15.5 13.5L12 19.5H18.5Z" fill="#FFBA00" />
              </svg>
              {isLoaded
                ? "Select from Google Drive"
                : "Loading Google Drive..."}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-400"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-900 px-2 text-slate-400">or</span>
              </div>
            </div>

            <label
              htmlFor="image-upload"
              className="cursor-pointer rounded-lg bg-slate-700 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:bg-slate-600 hover:shadow-xl"
            >
              Select from Local Drive
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleLocalImageSelect}
              className="hidden"
            />
          </div>
          <p className="mt-4 text-sm text-slate-300">
            Click to add images • Drag them around • Watch them fall
          </p>
        </div>
      </div>

      {selectedImages.length > 0 && (
        <div className="pointer-events-auto absolute right-4 top-4 rounded-lg bg-white/10 p-4 backdrop-blur-sm">
          <p className="text-sm font-medium text-white">
            Images: {selectedImages.length}
          </p>
          <button
            onClick={() => setSelectedImages([])}
            className="mt-2 rounded bg-red-500 px-3 py-1 text-xs text-white hover:bg-red-600"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
