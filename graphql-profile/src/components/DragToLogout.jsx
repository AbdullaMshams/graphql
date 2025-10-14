import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";

export default function DragToLogout({ onLogout }) {
  // Use a ref to access the animation controls
  const controls = useAnimation(); 
  const x = useMotionValue(0);

  // Define constants
  const HANDLE_SIZE_W = 150; 
  const HANDLE_SIZE_H = 100; 
  const DRAG_CONSTRAINTS_RIGHT = 300; 
  const LOGOUT_THRESHOLD = 300; // Drag distance needed to trigger logout

  // Color transformation
  const color = useTransform(x, [0, DRAG_CONSTRAINTS_RIGHT / 2, DRAG_CONSTRAINTS_RIGHT], [
    "rgb(255, 255, 255)",
    "rgb(255, 255, 0)",
    "rgb(3, 209, 0)",
  ]);

  // Opacity for the stationary "Drag to Logout" text
  const textOpacity = useTransform(x, [0, 50], [1, 0.2]);

  // FIX: Use Framer Motion's `useAnimation` for controlled snapping.
  // Note: Since `useAnimation` is not in the imports, you need to add it:
  // import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
  
  const handleDragEnd = (_, info) => {
    if (info.offset.x > LOGOUT_THRESHOLD) { 
      // 1. If threshold is met, call the logout function
      onLogout();
      // OPTIONAL: Snap it past the logout point for a visual confirmation
      controls.start({ x: DRAG_CONSTRAINTS_RIGHT + 50, transition: { type: "spring", stiffness: 500, damping: 30 } });
    } else {
      // 2. FIX: If threshold NOT met, smoothly animate 'x' back to 0
      controls.start({ 
          x: 0, 
          transition: { 
              type: "spring", // Use a spring physics for a nice "snap back" effect
              stiffness: 500, 
              damping: 30 
          } 
      }); 
    }
  };

  return (
    // Outer container: The track
    <motion.div
      className="relative w-full h-full min-h-[120px] rounded-xl flex items-center bg-white/5 overflow-hidden" 
    >
      {/* Background Action Label */}
      <motion.span 
          style={{ 
              opacity: useTransform(x, [0, 150], [0, 1]),
              left: HANDLE_SIZE_W + 20 
          }}
          className="absolute text-lg font-semibold text-green-400 whitespace-nowrap"
      >
      </motion.span>


      {/* Stationary Label */}
      <motion.span
        style={{ opacity: textOpacity }}
        className="absolute left-[170px] text-lg font-medium text-white/70 whitespace-nowrap"
      >
        Drag to Logout
      </motion.span>

      {/* The Draggable Handle */}
      <motion.div
        // Use the `animate` prop tied to controls and `style` for the motion value
        animate={controls}
        style={{
          x,
          width: HANDLE_SIZE_W,
          height: HANDLE_SIZE_H,
          background: "#3e3f46", 
          borderRadius: 12,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "grab",
          marginLeft: "10px",
        }}
        drag="x"
        dragConstraints={{ left: 0, right: DRAG_CONSTRAINTS_RIGHT }}
        dragElastic={0.05} 
        onDragEnd={handleDragEnd}
        className="shadow-2xl" 
      >
        {/* SVG Icon */}
        <motion.svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <motion.path
            d="M17 16L21 12M21 12L17 8M21 12H7M7 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H7"
            stroke={color} 
            strokeWidth="2.5" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.div>
    </motion.div>
  );
}