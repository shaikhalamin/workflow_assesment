import { convert } from 'html-to-text';
import { createElement } from 'react';
import type { ComponentProps, ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { BrandConfig } from './brand';
import { Welcome } from './welcome.template';

const renderers = {
  welcome: (props: ComponentProps<typeof Welcome>) =>
    createElement(Welcome, props),
};

export type TemplateName = keyof typeof renderers;
export type TemplateProps<T extends TemplateName> = Parameters<
  (typeof renderers)[T]
>[0];

export type EmailRenderInput = {
  [K in TemplateName]: {
    template: K;
    props: Omit<TemplateProps<K>, 'brand'>;
  };
}[TemplateName];

function renderElement(element: ReactElement): { html: string; text: string } {
  const doctype =
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';
  const html = `${doctype}${renderToStaticMarkup(element)}`;
  const text = convert(html, {
    wordwrap: false,
    selectors: [
      { selector: 'img', format: 'skip' },
      {
        selector: 'a',
        options: { hideLinkHrefIfSameAsText: true, linkBrackets: false },
      },
    ],
  });
  return { html, text };
}

function renderTemplate<T extends TemplateName>(
  template: T,
  props: Omit<TemplateProps<T>, 'brand'>,
  brand: BrandConfig,
): { html: string; text: string } {
  const fullProps = { ...props, brand } as TemplateProps<T>;
  const dispatch = renderers as {
    [K in TemplateName]: (props: TemplateProps<K>) => ReactElement;
  };
  return renderElement(dispatch[template](fullProps));
}

export function renderEmail(
  input: EmailRenderInput,
  brand: BrandConfig,
): Promise<{ html: string; text: string }> {
  return Promise.resolve(renderTemplate(input.template, input.props, brand));
}
