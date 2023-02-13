export function getRequestOptions(
  request: Request,
  defaults: {
    originalHost?: string;
    transforms?: string[];
  } = {},
  defaultsOnlyForLighthouse: boolean = true
) {
  if (
    defaultsOnlyForLighthouse &&
    !request.headers.get("User-Agent")?.includes("Lighthouse")
  ) {
    defaults = {};
  }

  const originalHost =
    request.headers.get("x-host") ??
    new URL(request.url).searchParams.get("host") ??
    defaults.originalHost;

  let transforms =
    request.headers.get("x-transform")?.split(",") ??
    new URL(request.url).searchParams.get("transforms")?.split(",") ??
    defaults.transforms;
  transforms = transforms?.map((i) => i.trim());

  return { request, originalHost, transforms };
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
