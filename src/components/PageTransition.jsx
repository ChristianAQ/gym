import { motion } from "framer-motion";

const VARIANTS = {
  fade: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: 0.22, ease: "easeOut" },
  },
  "slide-up": {
    initial: { opacity: 0, y: "100%" },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: "100%" },
    transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] },
  },
  "slide-right": {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
    transition: { duration: 0.22, ease: "easeOut" },
  },
};

export default function PageTransition({ children, variant = "fade", className = "" }) {
  const v = VARIANTS[variant] || VARIANTS.fade;
  return (
    <motion.div
      initial={v.initial}
      animate={v.animate}
      exit={v.exit}
      transition={v.transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
