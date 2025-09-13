'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ScrollAnimatorProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

/**
 * 滚动动画组件
 * 当元素进入视口时触发动画效果
 */
export default function ScrollAnimator({
  children,
  className = '',
  delay = 0,
  duration = 0.6,
  direction = 'up'
}: ScrollAnimatorProps) {
  // 根据方向设置初始位置
  const getInitialPosition = () => {
    switch (direction) {
      case 'up':
        return { y: 50, opacity: 0 };
      case 'down':
        return { y: -50, opacity: 0 };
      case 'left':
        return { x: 50, opacity: 0 };
      case 'right':
        return { x: -50, opacity: 0 };
      default:
        return { y: 50, opacity: 0 };
    }
  };

  // 动画结束位置
  const finalPosition = {
    x: 0,
    y: 0,
    opacity: 1
  };

  return (
    <motion.div
      className={className}
      initial={getInitialPosition()}
      whileInView={finalPosition}
      viewport={{ 
        once: false, // 允许重复触发动画，支持双向滚动
        amount: 0.3 // 当元素30%进入视口时触发
      }}
      transition={{
        duration,
        delay,
        ease: 'easeOut'
      }}
    >
      {children}
    </motion.div>
  );
}