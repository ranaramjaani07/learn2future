import React, { useEffect, useRef, useState } from "react";

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  speed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  decay: number;
}

export const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({
    x: -1000,
    y: -1000,
    targetX: -1000,
    targetY: -1000,
    isHovering: false,
    speed: 0,
  });
  const ripplesRef = useRef<Ripple[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const [mounted, setMounted] = useState(false);
  const isDarkRef = useRef(false);

  useEffect(() => {
    setMounted(true);

    // Track theme changes
    const checkTheme = () => {
      isDarkRef.current = document.documentElement.classList.contains("dark");
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let time = 0;

    // Handle Resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Track Mouse
    const handleMouseMove = (e: MouseEvent) => {
      const mouse = mouseRef.current;
      const dx = e.clientX - mouse.targetX;
      const dy = e.clientY - mouse.targetY;
      mouse.speed = Math.min(Math.sqrt(dx * dx + dy * dy), 45); // cap speed

      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.isHovering = true;

      // Spawn bubbles/trail when moving
      if (mouse.speed > 5 && Math.random() < 0.4) {
        particlesRef.current.push({
          x: mouse.x + (Math.random() - 0.5) * 15,
          y: mouse.y + (Math.random() - 0.5) * 15,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -Math.random() * 1.2 - 0.5,
          radius: Math.random() * 2 + 1,
          alpha: 0.8,
          decay: Math.random() * 0.015 + 0.01,
        });
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.isHovering = false;
    };

    // Handle click to create liquid water ripple
    const handleCanvasClick = (e: MouseEvent) => {
      ripplesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: Math.max(width, height) * 0.4,
        opacity: 1.0,
        speed: 4.5,
      });

      // Spawn a burst of splash particles
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const force = Math.random() * 3 + 1;
        particlesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * force,
          vy: Math.sin(angle) * force,
          radius: Math.random() * 3 + 1.5,
          alpha: 1.0,
          decay: Math.random() * 0.02 + 0.015,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("click", handleCanvasClick);

    // Initial position
    mouseRef.current.x = width / 2;
    mouseRef.current.y = height / 2;
    mouseRef.current.targetX = width / 2;
    mouseRef.current.targetY = height / 2;

    // Animation Loop
    const render = () => {
      time += 0.006;
      ctx.clearRect(0, 0, width, height);

      const isDark = isDarkRef.current;
      const mouse = mouseRef.current;

      // Smoothly lerp mouse cursor (inertial tracking)
      const lerpFactor = 0.085;
      mouse.x += (mouse.targetX - mouse.x) * lerpFactor;
      mouse.y += (mouse.targetY - mouse.y) * lerpFactor;

      // 1. Draw Liquid Water Waves in the Background
      // Base theme background fill
      ctx.fillStyle = isDark ? "#080808" : "#fbfbfa";
      ctx.fillRect(0, 0, width, height);

      // Liquid overlay gradient (organic moving water-like circles)
      const wGradient = ctx.createRadialGradient(
        width * 0.5 + Math.sin(time * 0.5) * 150,
        height * 0.4 + Math.cos(time * 0.4) * 120,
        10,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75
      );

      if (isDark) {
        wGradient.addColorStop(0, "rgba(245, 179, 0, 0.06)"); // Soft brand gold deep glow
        wGradient.addColorStop(0.5, "rgba(230, 140, 0, 0.015)");
        wGradient.addColorStop(1, "rgba(8, 8, 8, 0)");
      } else {
        wGradient.addColorStop(0, "rgba(255, 235, 180, 0.2)"); // Golden sand water hue
        wGradient.addColorStop(0.5, "rgba(245, 179, 0, 0.03)");
        wGradient.addColorStop(1, "rgba(251, 251, 250, 0)");
      }
      ctx.fillStyle = wGradient;
      ctx.fillRect(0, 0, width, height);

      // Draw another subtle flowing wave on top
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 40) {
        const yOffset = Math.sin(x * 0.003 + time) * 20 + Math.cos(x * 0.001 - time) * 10;
        ctx.lineTo(x, height * 0.85 + yOffset);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fillStyle = isDark ? "rgba(245, 179, 0, 0.01)" : "rgba(245, 179, 0, 0.015)";
      ctx.fill();

      // 2. Grid Constants
      const spacing = 48; // Increased from 32 to 48 for much faster performance and cleaner aesthetic
      const columns = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      // Distorted grid points matrix
      const points: { x: number; y: number; lightIntensity: number }[][] = [];

      for (let r = 0; r < rows; r++) {
        points[r] = [];
        const originalY = r * spacing;

        for (let c = 0; c < columns; c++) {
          const originalX = c * spacing;

          // Default state
          let dispX = originalX;
          let dispY = originalY;

          // Compute distance to mouse
          const dx = originalX - mouse.x;
          const dy = originalY - mouse.y;
          const distToMouse = Math.sqrt(dx * dx + dy * dy);

          // Spotlight / Flashlight Intensity calculation
          // Illuminates grid near cursor
          const maxLightRadius = 160;
          let lightIntensity = 0;
          if (distToMouse < maxLightRadius) {
            lightIntensity = (1 - distToMouse / maxLightRadius) ** 1.8;
          }

          // A. Sinking Depression Effect ("grid halka sa dhes rha he nise ja rha he")
          // We simulate a 3D bowl depression by pushing points radially away and shifting them down (Y-axis)
          const depressRadius = 140;
          if (distToMouse < depressRadius) {
            const force = (1 - distToMouse / depressRadius) ** 2.2;
            dispX += dx * force * 0.18; // push outwards for 3D perspective distortion
            dispY += dy * force * 0.18 + force * 15; // Shift down physically by 15px to look "sunken"
          }

          // B. Liquid ripple distortions
          ripplesRef.current.forEach((ripple) => {
            const rx = originalX - ripple.x;
            const ry = originalY - ripple.y;
            const rDist = Math.sqrt(rx * rx + ry * ry);
            const rippleWidth = 80;

            const distFromWavefront = Math.abs(rDist - ripple.radius);
            if (distFromWavefront < rippleWidth) {
              const wavePower = (1 - distFromWavefront / rippleWidth) * ripple.opacity;
              // Sine wave oscillation for water ripple effect
              const waveOffset = Math.sin((rDist - ripple.radius) * 0.1) * 12 * wavePower;
              const angle = rDist === 0 ? 0 : Math.atan2(ry, rx);
              dispX += Math.cos(angle) * waveOffset;
              dispY += Math.sin(angle) * waveOffset;
            }
          });

          points[r][c] = { x: dispX, y: dispY, lightIntensity };
        }
      }

      // 3. Draw Grid Lines with glowing color shift (BATCHED FOR 100x FASTER RENDERING)
      ctx.lineWidth = 1.0;
      ctx.shadowBlur = 0;

      // Group normal faint grid lines into a single path to execute 1 stroke instead of 4000+ individual strokes
      ctx.beginPath();
      const faintStyle = isDark ? "rgba(255, 255, 255, 0.035)" : "rgba(0, 0, 0, 0.045)";
      ctx.strokeStyle = faintStyle;

      const glowingLines: { x1: number; y1: number; x2: number; y2: number; intensity: number }[] = [];

      // Collect horizontal lines
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns - 1; c++) {
          const p1 = points[r][c];
          const p2 = points[r][c + 1];
          const avgLight = (p1.lightIntensity + p2.lightIntensity) / 2;

          if (avgLight > 0.02) {
            glowingLines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, intensity: avgLight });
          } else {
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
          }
        }
      }

      // Collect vertical lines
      for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows - 1; r++) {
          const p1 = points[r][c];
          const p2 = points[r + 1][c];
          const avgLight = (p1.lightIntensity + p2.lightIntensity) / 2;

          if (avgLight > 0.02) {
            glowingLines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, intensity: avgLight });
          } else {
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
          }
        }
      }

      // Execute single massive stroke for all standard grid segments
      ctx.stroke();

      // Draw the illuminated gold spotlights separately (since there are very few around the mouse)
      if (glowingLines.length > 0) {
        glowingLines.forEach((line) => {
          ctx.beginPath();
          ctx.moveTo(line.x1, line.y1);
          ctx.lineTo(line.x2, line.y2);
          ctx.strokeStyle = `rgba(245, 179, 0, ${0.08 + line.intensity * 0.65})`;
          ctx.shadowColor = "rgba(245, 179, 0, 0.4)";
          ctx.shadowBlur = line.intensity * 12;
          ctx.stroke();
        });
        ctx.shadowBlur = 0; // Reset shadow for next items
      }

      // 4. Update and Draw Expanding Ripples
      ripplesRef.current.forEach((ripple, index) => {
        ripple.radius += ripple.speed;
        ripple.opacity -= 0.008;

        if (ripple.opacity <= 0 || ripple.radius >= ripple.maxRadius) {
          ripplesRef.current.splice(index, 1);
        } else {
          // Draw a very subtle expanding circle representing the wavefront on water
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(245, 179, 0, ${ripple.opacity * 0.15})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // 5. Update and Draw Sparkle/Splash/Bubble Particles
      particlesRef.current.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particlesRef.current.splice(index, 1);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(245, 179, 0, ${p.alpha * 0.7})`;
          ctx.shadowColor = "#F5B300";
          ctx.shadowBlur = 5;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // 6. Floating Liquid Ball Orb over the grid
      if (mouse.isHovering) {
        const pulse = Math.sin(time * 5) * 2;
        const radius = 12 + pulse;

        // Draw outer spotlight aura
        const auraGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          95
        );
        auraGrad.addColorStop(0, "rgba(245, 179, 0, 0.22)");
        auraGrad.addColorStop(0.5, "rgba(245, 179, 0, 0.08)");
        auraGrad.addColorStop(1, "rgba(245, 179, 0, 0)");

        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 95, 0, Math.PI * 2);
        ctx.fillStyle = auraGrad;
        ctx.fill();

        // Draw main glassy liquid water-ball/droplet
        const orbGrad = ctx.createRadialGradient(
          mouse.x - radius * 0.35,
          mouse.y - radius * 0.35,
          radius * 0.05,
          mouse.x,
          mouse.y,
          radius
        );
        orbGrad.addColorStop(0, "#ffffff"); // white reflection spot
        orbGrad.addColorStop(0.2, "#FFDF80"); // yellow highlight
        orbGrad.addColorStop(0.7, "#F5B300"); // Solid gold branding color
        orbGrad.addColorStop(1, "#C28500"); // dark gold rim shadow

        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = orbGrad;
        ctx.shadowColor = "rgba(245, 179, 0, 0.6)";
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Overlay a glossy reflection cap on the orb
        ctx.beginPath();
        ctx.ellipse(
          mouse.x - radius * 0.25,
          mouse.y - radius * 0.25,
          radius * 0.3,
          radius * 0.15,
          -Math.PI / 4,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("click", handleCanvasClick);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{
          maskImage: "radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 95%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 95%)",
        }}
      />
    </div>
  );
};
