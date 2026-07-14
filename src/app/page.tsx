import { HomePage } from "@/features/home/home-page";
import { isPublicShowcase } from "@/lib/env";

export default function Page() {
  return <HomePage publicShowcase={isPublicShowcase()} />;
}
