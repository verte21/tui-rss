/**
 * Fetch and parse a full webpage
 */
export async function fetchWebpage(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    return html;
  } catch (error) {
    throw new Error(`Failed to fetch webpage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
