import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { COOKIES } from "@/consts";
import { api } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { DogIcon } from "lucide-react";
import { useCookies } from "react-cookie";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

const loginFormSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export default function LoginForm() {
  const [, setCookie] = useCookies([COOKIES.AUTHED]);

  async function login({ name, email }: { name: string; email: string }) {
    await api.post("/auth/login", { name, email });
  }

  let toastId: string | number | undefined;

  const loginMutation = useMutation({
    mutationKey: ["login"],
    mutationFn: login,
    onMutate: () => {
      toastId = toast.loading("Logging in...");
    },
    onSuccess: () => {
      toast.dismiss(toastId);
      toast.success("Logged in");
      setCookie(
        COOKIES.AUTHED,
        {
          name: form.getValues("name"),
          email: form.getValues("email"),
        },
        {
          path: "/",
          expires: new Date(Date.now() + 3600 * 1000), // 1 hour
          maxAge: 3600,
        }
      );
    },
    onError: (error) => {
      toast.dismiss(toastId);
      toast.error("Login failed");
      console.error("Login failed:", error);
    },
  });

  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  function onSubmit(values: z.infer<typeof loginFormSchema>) {
    loginMutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grow flex items-center justify-center"
      >
        <Card>
          <CardHeader className="items-center">
            <DogIcon className="size-12" />
            <CardTitle>PupFinder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>name</FormLabel>
                  <FormControl>
                    <Input placeholder="john" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>email</FormLabel>
                  <FormControl>
                    <Input placeholder="john@gmail.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit">Submit</Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
