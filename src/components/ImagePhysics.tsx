/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";

import { useGoogleDrivePicker } from "@/hooks/useGoogleDrivePicker";

/**
 * ImagePhysics Component
 * A physics-based interactive canvas where users can drop files (images, videos, documents)
 * and watch them fall and interact with realistic physics using Matter.js
 */
export default function ImagePhysics() {
  // Refs to store Matter.js instances (persist across renders)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);

  // State for selected files with their metadata
  const [selectedImages, setSelectedImages] = useState<
    Array<{ url: string; mimeType: string; name: string }>
  >([]);

  // Toggle preview panel visibility
  const [showPreview, setShowPreview] = useState(false);

  // Google Drive picker hook
  const { isLoaded, openPicker } = useGoogleDrivePicker();

  /**
   * Handle file selection from Google Drive
   * Converts selected files to our internal format and shows preview
   */
  const handleGoogleDriveSelect = () => {
    openPicker((files) => {
      const fileData = files.map((file) => ({
        url: file.url,
        mimeType: file.mimeType,
        name: file.name,
      }));
      setSelectedImages((prev) => [...prev, ...fileData]);
      setShowPreview(true);
    });
  };

  /**
   * Handle file selection from local file system
   * Creates blob URLs for local files
   */
  const handleLocalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileData: any[] = [];
    Array.from(files).forEach((file) => {
      // Create a local URL for the file
      const url = URL.createObjectURL(file);
      fileData.push({
        url,
        mimeType: file.type,
        name: file.name,
      });
    });

    setSelectedImages((prev) => [...prev, ...fileData]);
    setShowPreview(true);
  };

  /**
   * Remove a file from the selection
   * @param {number} index - Index of file to remove
   */
  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Initialize Matter.js physics engine and renderer
   * Runs once on component mount
   */
  useEffect(() => {
    if (!canvasRef.current) return;

    // Destructure Matter.js modules
    const {
      Engine,
      Render,
      Runner,
      Bodies,
      Composite,
      Mouse,
      MouseConstraint,
    } = Matter;

    // Create physics engine
    const engine = Engine.create();
    engineRef.current = engine;

    // Create canvas renderer
    const render = Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false, // Use colors instead of wireframes
        background: "transparent", // Transparent to show gradient background
      },
    });
    renderRef.current = render;

    /**
     * Create static boundaries (ground and walls)
     * These prevent objects from falling off screen
     */
    const ground = Bodies.rectangle(
      window.innerWidth / 2,
      window.innerHeight,
      window.innerWidth,
      60,
      {
        isStatic: true, // Won't move or be affected by physics
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

    // Add boundaries to the physics world
    Composite.add(engine.world, [ground, leftWall, rightWall]);

    /**
     * Add mouse interaction
     * Allows users to drag and throw objects
     */
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2, // How rigid the mouse constraint is
        render: { visible: false }, // Hide the constraint line
      },
    });

    Composite.add(engine.world, mouseConstraint);

    // Start the physics simulation
    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    /**
     * Handle window resize
     * Updates canvas and boundary positions
     */
    const handleResize = () => {
      render.canvas.width = window.innerWidth;
      render.canvas.height = window.innerHeight;
      render.options.width = window.innerWidth;
      render.options.height = window.innerHeight;

      // Update ground and wall positions
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

    // Cleanup on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      render.canvas.remove();
    };
  }, []);

  /**
   * Add new files to the physics simulation
   * Runs whenever selectedImages changes
   * Only adds the most recently added file to avoid duplicates
   */
  useEffect(() => {
    if (!engineRef.current || selectedImages.length === 0) return;

    const { Bodies, Composite } = Matter;
    const lastIndex = selectedImages.length - 1;
    const file = selectedImages[lastIndex];

    /**
     * Handle different file types with appropriate visual representations
     */

    // IMAGES: Display actual image texture
    if (file.mimeType?.startsWith("image/")) {
      const img = new Image();
      img.src = file.url;

      img.onload = () => {
        const size = 100;
        // Random position at top of screen
        const x = Math.random() * (window.innerWidth - 200) + 100;
        const y = Math.random() * 200 + 50;

        // Create physics body with image texture
        const imageBody = Bodies.rectangle(x, y, size, size, {
          restitution: 0.6, // Bounciness (0-1)
          friction: 0.1, // Surface friction
          render: {
            sprite: {
              texture: file.url,
              xScale: size / img.width, // Scale to fit
              yScale: size / img.height,
            },
          },
        });

        Composite.add(engineRef.current!.world, imageBody);
      };

      // Fallback if image fails to load
      img.onerror = () => {
        console.error("Failed to load image:", file.url);
        addColoredBox();
      };
    }
    // VIDEOS: Blue bordered rectangle with play icon appearance
    else if (file.mimeType?.startsWith("video/")) {
      const size = 120;
      const x = Math.random() * (window.innerWidth - 200) + 100;
      const y = Math.random() * 200 + 50;

      const videoBody = Bodies.rectangle(x, y, size, size * 0.75, {
        restitution: 0.6,
        friction: 0.1,
        render: {
          fillStyle: "#1e293b", // Dark background
          strokeStyle: "#3b82f6", // Blue border
          lineWidth: 3,
        },
      });

      Composite.add(engineRef.current!.world, videoBody);
    }
    // OTHER FILES: Gray document-style rectangle
    else {
      const size = 100;
      const x = Math.random() * (window.innerWidth - 200) + 100;
      const y = Math.random() * 200 + 50;

      const fileBody = Bodies.rectangle(x, y, size, size * 1.2, {
        restitution: 0.6,
        friction: 0.1,
        render: {
          fillStyle: "#f1f5f9", // Light gray
          strokeStyle: "#64748b", // Darker gray border
          lineWidth: 2,
        },
      });

      Composite.add(engineRef.current!.world, fileBody);
    }

    /**
     * Helper function to add a colored box when image loading fails
     */
    function addColoredBox() {
      const size = 100;
      const x = Math.random() * (window.innerWidth - 200) + 100;
      const y = Math.random() * 200 + 50;

      const imageBody = Bodies.rectangle(x, y, size, size, {
        restitution: 0.6,
        friction: 0.1,
        render: {
          fillStyle: `hsl(${Math.random() * 360}, 70%, 60%)`, // Random color
        },
      });

      Composite.add(engineRef.current!.world, imageBody);
    }
  }, [selectedImages]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Physics canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* File selection buttons - fade out when files are selected */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className={`pointer-events-auto text-center transition-opacity duration-300 ${selectedImages.length > 0 ? "opacity-0" : "opacity-100"}`}
        >
          <div className="flex flex-col gap-3">
            {/* Google Drive button */}
            <button
              onClick={handleGoogleDriveSelect}
              disabled={!isLoaded}
              className="flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-slate-900 shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {/* Google Drive icon */}
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

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-400"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-900 px-2 text-slate-400">or</span>
              </div>
            </div>

            {/* Local file upload button */}
            <label
              htmlFor="image-upload"
              className="cursor-pointer rounded-lg bg-slate-700 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:bg-slate-600 hover:shadow-xl"
            >
              Select from Local Drive
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*,video/*,.pdf,.txt,.doc,.docx"
              multiple
              onChange={handleLocalImageSelect}
              className="hidden"
            />
          </div>
          <p className="mt-4 text-sm text-slate-300">
            Select images, videos, PDFs, and documents • Drag them around •
            Watch them fall
          </p>
        </div>
      </div>

      {/* Control buttons - show when files are selected */}
      {selectedImages.length > 0 && (
        <>
          <div className="pointer-events-auto absolute right-4 top-4 flex gap-2">
            {/* Toggle preview button */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>
            {/* Clear all button */}
            <button
              onClick={() => {
                setSelectedImages([]);
                setShowPreview(false);
              }}
              className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-red-600"
            >
              Clear All
            </button>
          </div>

          {/* Preview panel - shows thumbnails of selected files */}
          {showPreview && (
            <div className="pointer-events-auto absolute bottom-4 left-4 right-4 max-h-48 overflow-y-auto rounded-lg bg-white/95 p-4 shadow-2xl backdrop-blur-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Selected Files ({selectedImages.length})
              </h3>
              {/* Grid of file thumbnails */}
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                {selectedImages.map((file, index) => (
                  <div
                    key={index}
                    className="group relative aspect-square overflow-hidden rounded-lg border-2 border-slate-200 bg-slate-100 transition-all hover:border-blue-500"
                  >
                    {/* Render different previews based on file type */}
                    {file.mimeType?.startsWith("image/") ? (
                      // Image preview
                      <img
                        src={file.url}
                        alt={file.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          // Fallback SVG if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3EImage%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    ) : file.mimeType?.startsWith("video/") ? (
                      // Video preview with play icon
                      <div className="flex h-full w-full items-center justify-center bg-slate-800">
                        <svg
                          className="h-8 w-8 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                        </svg>
                      </div>
                    ) : (
                      // Document preview with file extension
                      <div className="flex h-full w-full flex-col items-center justify-center bg-slate-200 p-2">
                        <svg
                          className="h-6 w-6 text-slate-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="mt-1 text-[8px] text-slate-600">
                          {file.name.split(".").pop()?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    {/* Remove button - appears on hover */}
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                      title="Remove file"
                    >
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
