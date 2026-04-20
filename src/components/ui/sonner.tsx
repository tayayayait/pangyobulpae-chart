import { useTheme } from "next-themes";
import { Toaster as Sonner, toast as sonnerToast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;
type ToastMessage = Parameters<typeof sonnerToast.success>[0];
type ToastOptions = Parameters<typeof sonnerToast.success>[1];

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        duration: 3000,
        classNames: {
          toast:
            "group toast w-[360px] max-w-[calc(100vw-2rem)] group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

const toast = {
  ...sonnerToast,
  success(message: ToastMessage, options?: ToastOptions) {
    return sonnerToast.success(message, { duration: 3000, ...options });
  },
  error(message: ToastMessage, options?: ToastOptions) {
    return sonnerToast.error(message, { duration: 6000, ...options });
  },
};

export { Toaster, toast };
