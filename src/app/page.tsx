import { HomePage } from "@/features/home/home-page";
import { isPublicShowcase } from "@/lib/env";
import "./showcase.css";

export default function Page() {
  return <HomePage publicShowcase={isPublicShowcase()} />;
}
