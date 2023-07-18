export class ElementRemover {
  element(element: Element) {
    element.remove();
  }
}

export class ElementAppender {
  constructor(private content: string | (() => string)) {}

  element(element: Element) {
    element.append(
      typeof this.content === "string" ? this.content : this.content(),
      { html: true }
    );
  }
}

export class ElementPrepender {
  constructor(private content: string | (() => string)) {}

  element(element: Element) {
    element.prepend(
      typeof this.content === "string" ? this.content : this.content(),
      { html: true }
    );
  }
}

export class TextReplacer {
  constructor(
    private callback: (text: string) => string | Promise<string>,
    private options?: ContentOptions
  ) {}

  private textString: string = "";

  async text(text: Text) {
    this.textString += text.text;
    if (text.lastInTextNode) {
      text.replace(await this.callback(this.textString), this.options);
    } else {
      text.remove();
    }
  }
}

export class ResourceProxier {
  constructor(private filter: (srcOrHrefOrSrcSet: string) => boolean) {}

  element(element: Element) {
    const src = element.getAttribute("src");
    if (src && this.filter(src) && !src.startsWith("data:")) {
      element.setAttribute("src", `/_3perf-proxy/${src}`);
    }

    // Eg for `<link rel="preload">`
    const href = element.getAttribute("href");
    if (href && this.filter(href) && !href.startsWith("data:")) {
      element.setAttribute("href", `/_3perf-proxy/${href}`);
    }

    const srcSet = element.getAttribute("srcset");
    if (srcSet && this.filter(srcSet) && !srcSet.startsWith("data:")) {
      element.setAttribute(
        "srcset",
        srcSet
          .split(",")
          .map((part) => `/_3perf-proxy/${part.trim()}`)
          .join(", ")
      );
    }

    // Eg for `<link rel="preload">`
    const imageSrcSet = element.getAttribute("imagesrcset");
    if (
      imageSrcSet &&
      this.filter(imageSrcSet) &&
      !imageSrcSet.startsWith("data:")
    ) {
      element.setAttribute(
        "imagesrcset",
        imageSrcSet
          .split(",")
          .map((part) => `/_3perf-proxy/${part.trim()}`)
          .join(", ")
      );
    }
  }
}
