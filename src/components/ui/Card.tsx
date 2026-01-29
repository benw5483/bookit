"use client";

import { ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  hover?: boolean;
}

export function Card({ children, className, hover = true, ...props }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-lg",
        hover && "cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
