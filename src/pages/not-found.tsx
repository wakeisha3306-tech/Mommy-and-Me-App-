import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-8"
        >
          <span className="text-5xl font-serif text-primary">404</span>
        </motion.div>
        
        <h1 className="text-3xl font-serif text-foreground mb-4">
          Oops, you've wandered off the path
        </h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          This page doesn't exist, but that's okay. Let's get you back to a familiar place.
        </p>
        
        <Link 
          href="/"
          className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
        >
          Return Home
        </Link>
      </div>
    </Layout>
  );
}
