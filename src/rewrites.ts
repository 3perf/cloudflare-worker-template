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

export class ImageProxier {
  constructor(private filter: (srcOrSrcSet: string) => boolean) {}

  element(element: Element) {
    const src = element.getAttribute("src");
    const srcSet = element.getAttribute("srcset");

    if (!src && !srcSet) return;
    if ((src && !this.filter(src)) || (srcSet && !this.filter(srcSet))) return;

    if (src) {
      element.setAttribute("src", `/_3perf-proxy/${src}`);
    }

    if (srcSet) {
      element.setAttribute(
        "srcset",
        srcSet
          .split(",")
          .map((part) => `/_3perf-proxy/${part.trim()}`)
          .join(", ")
      );
    }
  }
}
