import { permanentRedirect } from "next/navigation";
import type { Route } from "next";

export default function OrnekTahkimPage() {
  permanentRedirect("/vaka/85k-kuyumculuk-tahkim" as Route);
}
