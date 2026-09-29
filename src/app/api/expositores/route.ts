import { submitExpositor } from "@/lib/submission";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  return submitExpositor(request);
}
