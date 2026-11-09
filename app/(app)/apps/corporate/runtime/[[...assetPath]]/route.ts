import { serveProductRuntimeAsset } from "../../../../../../lib/productRuntimeServer";

type RuntimeRouteProps = {
  params: Promise<{ assetPath?: string[] }>;
};

export async function GET(request: Request, { params }: RuntimeRouteProps) {
  const { assetPath } = await params;
  return serveProductRuntimeAsset(request, "corporate", assetPath);
}
