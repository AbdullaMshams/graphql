import { motion, useMotionValue, useTransform } from "framer-motion";

export default function DragToLogout({ onLogout }) {
  const x = useMotionValue(0);

  // const background = useTransform(x, [-100, 0, 100], [
  //   "width: 100%",
  //         "height: 100%",
    
  // ]);

  const color = useTransform(x, [-100, 0, 100], [
    "rgb(211, 9, 225)",
    "#fff",
    "rgb(3, 209, 0)",
  ]);

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 100) {
      onLogout();
    }
  };

  return (
    <motion.div
      style={{ width: '100%', height: '100%', background: "bg-gradient-to-br from-gray-900 via-black to-gray-950 " }}
      className="col-span-1 row-span-1 rounded-lg flex items-center justify-center"
    >
      <motion.div
        style={{
          x,
          width: '100%',
          height: '100%',
          backgroundColor: "#bg-gradient-to-br from-gray-900 via-black to-gray-950 ",
          borderRadius: 20,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "grab",
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        onDragEnd={handleDragEnd}
      >
        <svg width="40" height="40" viewBox="0 0 50 50">
          <motion.path
            fill="none"
            strokeWidth="2"
            stroke={color}
            d="M 0, 20 a 20, 20 0 1,0 40,0 a 20, 20 0 1,0 -40,0"
            style={{ x: 5, y: 5 }}
          />
          <motion.path
            fill="none"
            strokeWidth="2"
            stroke={color}
            d="M14,26 L 22,33 L 35,16"
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}
