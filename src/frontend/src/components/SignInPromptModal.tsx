import { Button } from "@/components/ui/button";
import { LogIn, ShieldCheck, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface SignInPromptModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
  isLoggingIn?: boolean;
  message?: string;
}

export function SignInPromptModal({
  open,
  onClose,
  onLogin,
  isLoggingIn = false,
  message = "Please sign in with Internet Identity to perform this action.",
}: SignInPromptModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            aria-modal="true"
            aria-labelledby="signin-modal-title"
            data-ocid="signin.modal"
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm"
          >
            <div className="relative bg-sidebar rounded-xl border border-primary/40 shadow-2xl overflow-hidden">
              {/* Gold top accent */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                data-ocid="signin.close_button"
                aria-label="Cancel"
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-7 flex flex-col items-center gap-5">
                {/* Icon */}
                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-primary" />
                </div>

                {/* Title */}
                <div className="text-center space-y-1.5">
                  <h2
                    id="signin-modal-title"
                    className="text-lg font-semibold text-foreground tracking-tight"
                  >
                    Sign In Required
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {message}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2.5 w-full">
                  <Button
                    className="w-full gap-2 font-semibold"
                    onClick={onLogin}
                    disabled={isLoggingIn}
                    data-ocid="signin.primary_button"
                  >
                    {isLoggingIn ? (
                      <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4" />
                    )}
                    {isLoggingIn
                      ? "Connecting…"
                      : "Connect with Internet Identity"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={onClose}
                    data-ocid="signin.cancel_button"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
