export interface FetchedDocument {
  url: string;
  title: string;
  content: string;
  length: number;
}

/**
 * Extracts URLs from text
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<">]+)/gi;
  const matches = text.match(urlRegex);
  return matches ? Array.from(new Set(matches)) : [];
}

/**
 * Clean HTML to readable main article text
 */
function cleanHtmlToText(htmlString: string): { title: string; text: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  // Remove noise elements (ads, navigation, sidebars, related posts, etc.)
  const elementsToRemove = doc.querySelectorAll(
    'script, style, noscript, iframe, svg, header, footer, nav, aside, .sidebar, .related, .recommend, .ad, .advertisement, .comments, .menu'
  );
  elementsToRemove.forEach(el => el.remove());

  const title = doc.title || 'Untitled Document';

  // Try to find the main article content container
  let mainContainer = doc.querySelector('article, main, [role="main"], .entry-content, .post-content, #content, .article-body');
  if (!mainContainer) {
    mainContainer = doc.body;
  }

  const htmlElement = mainContainer as HTMLElement;
  let text = htmlElement ? htmlElement.innerText || htmlElement.textContent || '' : '';

  // Clean up whitespace and linebreaks
  text = text
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0)
    .join('\n');

  return { title, text };
}

/**
 * Fetch and extract clean document content from a URL
 */
export async function fetchDocumentFromUrl(url: string, maxLength: number = 4000): Promise<FetchedDocument> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();

    let title = url;
    let content = rawText;

    if (contentType.includes('html') || rawText.includes('<html') || rawText.includes('<body')) {
      const cleaned = cleanHtmlToText(rawText);
      title = cleaned.title;
      content = cleaned.text;
    }

    // Truncate if content is too long
    if (content.length > maxLength) {
      content = content.slice(0, maxLength) + `\n\n...[本文が長いため ${maxLength} 文字に省略されました]`;
    }

    return {
      url,
      title: title.trim() || url,
      content: content.trim(),
      length: content.length
    };
  } catch (err: any) {
    console.error('Failed to fetch document:', err);
    throw new Error(`ドキュメントの取得に失敗しました (${url}): ${err.message || err}`);
  }
}
