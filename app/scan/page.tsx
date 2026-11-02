import type { Metadata } from "next";
import { CardScanner } from "@/components/CardScanner";

export const metadata: Metadata = { title: "Scan cards" };

export default function ScanPage() {
  return <CardScanner />;
}
