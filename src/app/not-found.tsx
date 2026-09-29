import Link from "next/link";
import { BrandShell } from "@/components/brand-shell";

export default function NotFound() {
  return <BrandShell><div className="fallback-page"><h1>No encontramos esta página.</h1><Link href="/" className="submit-button">Ir al formulario</Link></div></BrandShell>;
}
