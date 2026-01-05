import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    filter: 'blur(4px)',
  },
  in: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
  },
  out: {
    opacity: 0,
    scale: 1.02,
    filter: 'blur(4px)',
  }
};

const pageTransition = {
  type: 'spring',
  stiffness: 100,
  damping: 20,
  mass: 1,
  duration: 0.5
};

/**
 * Wrapper component to add premium transitions between pages.
 * Uses spring physics for a more natural feel.
 * @param {React.ReactNode} children 
 */
const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      style={{
        width: '100%',
        height: '100%',
        willChange: 'transform, opacity, filter'
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;

