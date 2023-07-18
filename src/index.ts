/*
  Example usage without WebPageTest:
  https://<worker-name>.iamakulov.workers.dev/?host=www.example.com&transforms=bypass

  Example WebPageTest script:
  setHeader x-host: www.example.com
  setHeader x-transform: bypass
  navigate https://<worker-name>.iamakulov.workers.dev
*/

import * as rewrites from "./rewrites";
import {
  getRequestOptions as getRequestOptions,
  ValidationError,
} from "./getRequestOptions";

function applyTransforms(
  rewriter: HTMLRewriter,
  transforms: string[],
  deps: {
    [dep: string]: unknown;
  } = {}
) {
  const bypassTransform = transforms.length === 1 && transforms[0] === "bypass";
  if (bypassTransform) return rewriter;

  const transformsSet = new Set(transforms);

  // Uncomment to enable (example transform):
  // if (transformsSet.delete("remove-google-optimize")) {
  //   rewriter = rewriter.on(
  //     'script[src="https://www.googleoptimize.com/optimize.js?id=GTM-XXXXXXX"]',
  //     new rewrites.ElementRemover()
  //   );
  // }

  if (transformsSet.size > 0) {
    throw new Error("Unknown transforms: " + transforms.join(","));
  }

  return rewriter;
}

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      // Uncomment to enable:
      // Get the IP
      // const ip = request.headers.get("CF-Connecting-IP");

      const url = new URL(request.url);

      // disallow crawlers (write a robots.txt file)
      if (url.pathname === "/robots.txt") {
        return new Response("User-agent: *\nDisallow: /", { status: 200 });
      }

      // Uncomment to enable:
      // Proxy requests going through /_3perf-proxy/ script
      // if (url.pathname.startsWith("/_3perf-proxy/")) {
      //   const fullUrlWithoutOrigin = request.url.replace(url.origin, "");
      //   let newUrl = fullUrlWithoutOrigin.replace("/_3perf-proxy/", "");
      //   if (newUrl.startsWith("//")) {
      //     newUrl = "https:" + newUrl;
      //   }
      //   return fetch(newUrl, request);
      // }

      const { originalHost, transforms } = getRequestOptions(
        request,
        {
          originalHost: "www.example.com",
        },
        true
      );
      if (!originalHost) {
        throw new ValidationError("x-host header not specified");
      }

      // Set our hostname to that listed in the x-host header
      url.hostname = originalHost;

      // Rewrite the HTML
      const acceptHeader = request.headers.get("accept");
      if (acceptHeader?.includes("text/html")) {
        if (!transforms) {
          throw new ValidationError(
            "x-transform header or ?transforms query param not specified"
          );
        }

        // store this particular HTML response for modification
        let oldResponse = await fetch(url.toString(), request);

        let rewriter = new HTMLRewriter();
        rewriter = applyTransforms(rewriter, transforms);

        let newResponse = rewriter.transform(oldResponse);
        newResponse.headers.set("x-applied-transforms", transforms.join(","));
        return newResponse;
      }

      // Or proxy any other request unmodified
      return fetch(url.toString(), request);
    } catch (error: any) {
      console.error(error);

      return new Response(error.stack || error.message || error, {
        status: error instanceof ValidationError ? 403 : 500,
      });
    }
  },
};
