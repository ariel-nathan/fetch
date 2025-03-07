import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="text-3xl">
      <h1>Hello World</h1>
      <p>{count}</p>
      <Button onClick={() => setCount(count + 1)}>Click Me</Button>
    </div>
  );
}
