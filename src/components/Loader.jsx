import { motion } from "framer-motion";
import { Flame } from "lucide-react";

export default function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950">
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Flame className="w-12 h-12 text-blaze-500" strokeWidth={2.5} />
      </motion.div>
    </div>
  );
}
