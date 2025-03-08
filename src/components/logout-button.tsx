import { COOKIES } from "@/consts";
import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { useCookies } from "react-cookie";
import { toast } from "sonner";
import { Button } from "./ui/button";

export default function LogoutButton() {
  const [, , removeCookie] = useCookies([COOKIES.AUTHED]);

  async function logout() {
    await api.post("/auth/logout");
  }

  let toastId: string | number | undefined;

  const logoutMutation = useMutation({
    mutationKey: ["logout"],
    mutationFn: logout,
    onMutate: () => {
      toastId = toast.loading("Logging out...");
    },
    onSuccess: () => {
      toast.dismiss(toastId);
      toast.success("Logged out");
      removeCookie(COOKIES.AUTHED);
    },
    onError: (error) => {
      toast.dismiss(toastId);
      toast.error("Logout failed");
      console.error("Logout failed:", error);
    },
  });

  return (
    <Button
      onClick={() => {
        logoutMutation.mutate();
      }}
    >
      Logout
    </Button>
  );
}
